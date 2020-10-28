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
      <div class="col-7 q-px-lg">
        <drop class="drop q-mr-md" @drop="handleXDrop">{{
          xAxis.Name ? xAxis.Name : "X-Axis"
        }}</drop>
        <drop class="drop q-mr-md" @drop="handleYDrop">Series</drop>
        <drop class="drop" @drop="handleSortDrop">Sort By</drop>
        <div class="row q-mt-md">
          <div class="col q-mr-md">
            <div class="text-center"><strong>Series</strong></div>
            <q-list bordered separator class="q-mt-md">
              <q-item v-for="(itm, idx) in droppedArray" :key="idx">
                <q-item-section>{{ itm.Name }}</q-item-section>
                <q-item-section>
                  <q-select
                    outlined
                    v-model="itm.AggType"
                    :options="getAggTypes(itm.Type)"
                    label="Select an aggregation type"
                    @input="computeGraphData"
                  />
                </q-item-section>
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
          <div class="col">
            <div class="text-center"><strong>Sorting</strong></div>
            <q-list bordered separator class="q-mt-md">
              <q-item v-for="(itm, idx) in droppedSortArray" :key="idx">
                <q-item-section>{{ itm.Name }}</q-item-section>
                <q-item-section>
                  <q-select
                    outlined
                    v-model="itm.Sort"
                    :options="['asc', 'desc']"
                    label="Select an sort option"
                    @input="computeGraphData"
                  />
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    name="close"
                    @click="removeFromDroppedSort(idx)"
                    style="cursor: pointer;"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
      <div class="col-3 q-px-lg">
        <q-file
          v-model="files"
          label="Drop an excel or CSV file here"
          filled
          max-files="1"
          multiple
          clearable
          @input="processFile"
        >
          <!-- <template v-slot:after>
            <q-btn round dense flat icon="send" @click.prevent="processFile" />
          </template> -->
        </q-file>
        <q-select
          outlined
          v-model="chartType"
          :options="chartTypeOptions"
          label="Select a chart type"
          class="q-mt-md"
          @input="setChartType"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
              <q-item-section>
                <q-item-label v-html="scope.opt.name"></q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon :name="scope.opt.icon" />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
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
import alasql from "alasql";
import { date } from "quasar";
// const { capitalize } = format;

export default {
  data() {
    return {
      isLoading: false,
      files: [],
      processedFile: "",
      chartType: "line",
      chartTypeOptions: [
        { name: "line", icon: "fas fa-chart-line" },
        { name: "area", icon: "fas fa-chart-area" },
        { name: "bar", icon: "fas fa-chart-bar" },
        { name: "pie", icon: "fas fa-chart-pie" },
        { name: "donut", icon: "fas fa-chart-pie" },
        { name: "polarArea", icon: "fas fa-chart-pie" },
      ],
      aggOptions: ["sum", "count", "avg", "max", "min"],
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
      droppedSortArray: [],
      xAxis: {},
      pagination: {
        rowsPerPage: 10,
      },
    };
  },
  methods: {
    // capitalizeWord(word) {
    //   return capitalize(word);
    // },
    queryData(inputArray, xProp, yProps, sortProps) {
      let aggClause = yProps
        .map((itm) => `${itm.AggType}([${itm.Name}]) AS [${itm.Name}]`)
        .reduce((acc, obj) => `${acc}, ${obj}`);

      let sortClause =
        sortProps.length > 0
          ? sortProps
              .map((itm) => `${itm.Name} ${itm.Sort}`)
              .reduce((acc, obj) => `${acc}, ${obj}`)
          : 1;

      let query = `SELECT ${xProp.Name}, ${aggClause} FROM ? GROUP BY ${xProp.Name} ORDER BY ${sortClause}`;
      console.log(query);

      return this.groupSumByTemp(alasql(query, [inputArray]), xProp, yProps);
    },
    // groupSumBy(inputArray, xProp, yProps) {
    //   return yProps.map((itm) => {
    //     return inputArray.reduce((accumulator, object) => {
    //       let key = object[xProp.Name];
    //       if (Object.prototype.toString.call(key) === "[object Date]") {
    //         key = date.formatDate(key, "YYYY-MM-DD");
    //       }

    //       if (!accumulator[key]) {
    //         if (itm.Type === "string" || itm.AggType === "count") {
    //           accumulator[key] = 1;
    //         } else {
    //           accumulator[key] =
    //             typeof object[itm.Name] === "undefined" || object[itm.Name] === null
    //               ? 0
    //               : object[itm.Name];
    //         }
    //       } else {
    //         if (itm.Type === "string" || itm.AggType === "count") {
    //           accumulator[key] += 1;
    //         } else {
    //           accumulator[key] += object[itm.Name];
    //         }
    //       }
    //       return accumulator;
    //     }, {});
    //   });
    // },
    groupSumByTemp(inputArray, xProp, yProps) {
      return yProps.map((itm) => {
        return inputArray.reduce((accumulator, object) => {
          let key = object[xProp.Name];
          if (Object.prototype.toString.call(key) === "[object Date]") {
            key = date.formatDate(key, "YYYY-MM-DD");
          }

          if (!accumulator[key]) {
            accumulator[key] = object[itm.Name];
          } else {
            accumulator[key] += object[itm.Name];
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

        let tArrCheck = tArr.map((row, rIdx) => {
          let type =
            row.filter((v, i, a) => a.indexOf(v) === i).length > 1
              ? "string"
              : row.filter((v, i, a) => a.indexOf(v) === i)[0];

          return {
            Name: typeof headers[rIdx] === "undefined" ? `Column${rIdx}` : headers[rIdx],
            Type: type,
            Sort: "asc",
            AggType: type === "string" ? "count" : "sum",
          };
        });

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
      this.computeGraphData();
    },
    handleYDrop(data) {
      if (!this.droppedArray.includes(data.item)) {
        this.droppedArray.push(data.item);
        this.computeGraphData();
      }
    },
    handleSortDrop(data) {
      if (!this.droppedSortArray.includes(data.item)) {
        this.droppedSortArray.push(data.item);
        this.computeGraphData();
      }
    },
    computeGraphData() {
      if (this.xAxis.Name && this.droppedArray.length > 0) {
        this.isLoading = true;

        let queryResults = this.queryData(
          this.realData,
          this.xAxis,
          this.droppedArray,
          this.droppedSortArray
        );

        if (this.chartType === "pie") {
          this.droppedArray.splice(1);
        }

        // let raw = this.groupSumBy(this.realData, this.xAxis, this.droppedArray);

        // console.log(
        //   "groupbyTemp: ",
        //   this.groupSumByTemp(raw1, this.xAxis, this.droppedArray)
        // );

        if (this.chartType === "pie" || this.chartType === "polarArea") {
          this.graphData = null;
          this.graphData = Object.values(queryResults[0]);
        } else {
          this.graphData = queryResults.map((itm, idx) => ({
            data: Object.values(itm),
            name: this.droppedArray[idx].Name,
          }));
        }

        if (this.chartType === "pie" || this.chartType === "polarArea") {
          this.graphOptions = null;
          this.graphOptions = {
            labels: Object.keys(queryResults[0]),
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
              categories: Object.keys(queryResults[0]),
              labels: {
                show: true,
                rotate: -90,
              },
            },
            dataLabels: {
              enabled: true,
              offsetY: -8,
              style: {
                colors: ["#333"],
              },
              background: {
                enabled: true,
                padding: 3,
              },
              formatter(val) {
                return typeof val === "number" ? val.toLocaleString() : val;
              },
            },
            tooltip: {
              x: {
                // show: true,
                formatter: (x) => x.toLocaleString(),
              },
            },
          };
        }
        this.isLoading = false;
      }
    },
    setChartType() {
      if (
        this.chartType === "pie" ||
        this.chartType === "donut" ||
        this.chartType === "polarArea"
      ) {
        this.droppedArray.length = 1;
      }
      this.computeGraphData();
    },
    removeFromDropped(idx) {
      this.droppedArray.splice(idx, 1);
      this.computeGraphData();
    },
    removeFromDroppedSort(idx) {
      this.droppedSortArray.splice(idx, 1);
      this.computeGraphData();
    },
    getAggTypes(type) {
      return type === "number" ? ["sum", "count", "avg", "max", "min"] : ["count"];
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
  min-width: 30%;
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
