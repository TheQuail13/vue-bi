<template>
  <q-page padding class="main-page">
    <div class="row justify-center q-mb-lg">
      <div class="col-2 q-px-lg">
        <q-list bordered>
          <q-virtual-scroll style="max-height: 300px;" :items="columnHeaders" separator>
            <template v-slot="{ item, index }">
              <drag style="cursor: move;" :transfer-data="{ item }">
                <q-item :key="index" bordered clickable>
                  <q-item-section>
                    <q-item-label>
                      <q-icon :name="getIcon(item.Type)" /> {{ item.Name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </drag>
            </template>
          </q-virtual-scroll>
        </q-list>
      </div>
      <div class="col-4 q-px-lg">
        <drop class="drop q-mr-md" @drop="handleXDrop">{{
          xAxis.Name ? xAxis.Name : "X-Axis"
        }}</drop>
        <drop class="drop" @drop="handleYDrop">Series</drop>
        <q-list bordered separator class="q-mt-md">
          <q-item v-for="(itm, idx) in droppedArray" :key="idx">
            <q-item-section>{{ itm.Name }}</q-item-section>
            <q-item-section side>
              <q-icon
                name="close"
                @click="removeFromDropped(idx)"
                style="cursor: pointer;"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col q-px-lg">
        <q-file
          v-model="files"
          label="Drop an excel or CSV file here"
          filled
          :counter-label="counterLabelFn"
          max-files="1"
          multiple
          clearable
        >
          <template v-slot:after>
            <q-btn round dense flat icon="send" @click.prevent="processFile" />
          </template>
        </q-file>
        <q-select
          outlined
          v-model="chartType"
          :options="chartTypeOptions"
          label="Select a chart type"
          class="q-mt-md"
          @input="setChartType"
        />
      </div>
    </div>
    <div class="row justify-center">
      <!-- <div class="col q-px-lg">
        <q-table title="Raw Data Preview" :data="tableData" :pagination="pagination" />
      </div> -->
      <div class="col q-px-lg">
        <apexchart
          height="750"
          width="100%"
          :type="chartType"
          :options="graphOptions"
          :series="graphData"
        ></apexchart>
      </div>
    </div>
    <q-inner-loading :showing="isLoading">
      <q-spinner-grid size="125px" color="green" />
    </q-inner-loading>
  </q-page>
</template>

<script>
import XLSX from "xlsx";
import { date } from "quasar";

export default {
  data() {
    return {
      isLoading: false,
      files: [],
      processedFile: "",
      chartType: "line",
      chartTypeOptions: ["line", "area", "bar", "pie", "polarArea"],
      columnHeaders: [],
      columnData: [],
      tableData: [],
      graphData: [
        {
          data: [],
        },
      ],
      graphOptions: {
        chart: {
          animations: {
            enabled: false,
          },
        },
        xaxis: {
          categories: [],
        },
        yaxis: {
          labels: {
            formatter: (val) => {
              return val.toLocaleString();
            },
          },
        },
      },
      graphSortOptions: {
        column: "",
        type: "asc",
      },
      realData: [],
      droppedArray: [],
      xAxis: {},
      pagination: {
        rowsPerPage: 10,
      },
    };
  },
  methods: {
    counterLabelFn({ totalSize }) {
      return `${totalSize}`;
    },
    groupSumBy(inputArray, xProp, yProps) {
      const sortedArray = inputArray.sort((a, b) =>
        a[xProp.Name] > b[xProp.Name] ? 1 : b[xProp.Name] > a[xProp.Name] ? -1 : 0
      );

      return yProps.map((itm) => {
        return sortedArray.reduce((accumulator, object) => {
          let key = object[xProp.Name];
          if (Object.prototype.toString.call(key) === "[object Date]") {
            key = date.formatDate(key, "YYYY-MM-DD");
          }

          if (!accumulator[key]) {
            if (itm.Type === "string") {
              accumulator[key] = 1;
            } else {
              accumulator[key] =
                typeof object[itm.Name] === "undefined" || object[itm.Name] === null
                  ? 0
                  : object[itm.Name];
            }
          } else {
            accumulator[key] += itm.Type === "string" ? 1 : object[itm.Name];
          }
          return accumulator;
        }, {});
      });
    },
    processFile() {
      this.isLoading = true;
      let f = this.files[0];
      let reader = new FileReader();

      reader.onload = (e) => {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          cellText: false,
          sheetStubs: true,
        });

        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];

        let baseData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let headers = baseData[0];

        let tableData = XLSX.utils.sheet_to_json(worksheet, {
          header: 0,
          raw: false, // only for table display
          defval: "",
        });

        let realData = XLSX.utils.sheet_to_json(worksheet, {
          header: 0,
          blankrows: true,
          defval: null,
        });

        let tArr = [];
        let dataArr = [];
        baseData.map((oRow, oIdx) => {
          if (oIdx > 0) {
            oRow.map((iRow, iIdx) => {
              let t = Object.prototype.toString.call(iRow) === "[object Date]";
              let ft = t === true ? "date" : typeof iRow;

              if (typeof tArr[iIdx] === "undefined") {
                tArr[iIdx] = [ft];
                dataArr[iIdx] = [iRow];
              } else {
                tArr[iIdx].push(ft);
                dataArr[iIdx].push(iRow);
              }
            });
          }
        });

        let tArrCheck = tArr.map((row, rIdx) => ({
          Name: typeof headers[rIdx] === "undefined" ? `Column${rIdx}` : headers[rIdx],
          Type:
            row.filter((v, i, a) => a.indexOf(v) === i).length > 1
              ? "string"
              : row.filter((v, i, a) => a.indexOf(v) === i)[0],
          Sort: "asc",
        }));

        this.realData = realData;
        this.tableData = tableData;
        this.columnHeaders = tArrCheck;
        this.columnData = dataArr;

        this.isLoading = false;
      };

      reader.readAsArrayBuffer(f);
    },
    getIcon(type) {
      switch (type) {
        case "date":
          return "fas fa-calendar-alt";
        case "number":
          return "fas fa-superscript";
        default:
          return "fas fa-font";
      }
    },
    handleXDrop(data) {
      this.xAxis = data.item;
    },
    handleYDrop(data) {
      if (!this.droppedArray.includes(data.item)) {
        this.droppedArray.push(data.item);
        this.computeGraphData();
      }
    },
    computeGraphData() {
      if (this.xAxis.Name && this.droppedArray.length > 0) {
        this.isLoading = true;

        if (this.chartType === "pie") {
          this.droppedArray.splice(1);
        }

        let raw = this.groupSumBy(this.realData, this.xAxis, this.droppedArray);

        if (this.chartType === "pie" || this.chartType === "polarArea") {
          this.graphData = null;
          this.graphData = Object.values(raw[0]);
        } else {
          this.graphData = raw.map((itm, idx) => ({
            data: Object.values(itm),
            name: this.droppedArray[idx].Name,
          }));
        }

        if (this.chartType === "pie" || this.chartType === "polarArea") {
          this.graphOptions = null;
          this.graphOptions = {
            labels: Object.keys(raw[0]),
          };
        } else {
          this.graphOptions = {
            chart: {
              animations: {
                enabled: true,
              },
            },
            plotOptions: {
              bar: {
                // horizontal: true,
                dataLabels: {
                  position: "top",
                },
              },
            },
            xaxis: {
              categories: Object.keys(raw[0]),
              labels: {
                show: true,
                rotate: -90,
              },
            },
            dataLabels: {
              enabled: true,
              enabledOnSeries: undefined,
              formatter(val) {
                return typeof val === "number" ? val.toLocaleString() : val;
              },
            },
          };
        }
        this.isLoading = false;
      }
    },
    setChartType() {
      this.computeGraphData();
    },
    removeFromDropped(idx) {
      this.droppedArray.splice(idx, 1);
      this.computeGraphData();
    },
  },
  computed: {},
};
</script>

<style>
.drag,
.drop {
  font-family: sans-serif;
  display: inline-block;
  border-radius: 10px;
  background: #ccc;
  position: relative;
  padding: 30px;
  text-align: center;
  vertical-align: top;
  min-width: 45%;
}

.drag {
  color: #fff;
  cursor: move;
  background: #777;
  border-right: 2px solid #555;
  border-bottom: 2px solid #555;
}

.drop {
  background: #eee;
  border-top: 2px solid #ccc;
  border-left: 2px solid #ccc;
}
</style>
