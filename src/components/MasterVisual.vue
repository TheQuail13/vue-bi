<template>
  <q-page padding class="main-page">
    <div class="row justify-center">
      <div class="col-2">
        <q-btn
          color="green"
          label="Add Calculated Field"
          class="full-width"
          @click="showCalculatedField = true"
        />
        <q-list>
          <q-item-label header><strong>Dimensions</strong></q-item-label>
          <q-virtual-scroll style="height: 40vh;" :items="colDimensions">
            <template v-slot="{ item, index }">
              <drag style="cursor: move;" :transfer-data="{ item }">
                <q-item :key="index" class="bg-primary text-white q-my-xs rounded-borders">
                  <q-item-section>
                    <q-item-label>
                      <q-icon :name="getIcon(item.DataType)" class="q-mr-sm" />{{ item.Name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </drag>
            </template>
          </q-virtual-scroll>
        </q-list>
        <q-list>
          <q-item-label header><strong>Values</strong></q-item-label>
          <q-virtual-scroll style="height: 40vh;" :items="colValues">
            <template v-slot="{ item, index }">
              <drag style="cursor: move;" :transfer-data="{ item }">
                <q-item :key="index" class="bg-green text-white q-my-xs rounded-borders">
                  <q-item-section>
                    <q-item-label>
                      <q-icon :name="getIcon(item.DataType)" class="q-mr-sm" />{{ item.Name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </drag>
            </template>
          </q-virtual-scroll>
        </q-list>
      </div>
      <div class="col-10">
        <div class="row">
          <div class="col-8 q-px-lg">
            <drop class="drop q-mr-md" @drop="handleXDrop">{{
              selectedXaxisDimension.Name ? selectedXaxisDimension.Name : "X-Axis"
            }}</drop>
            <drop class="drop q-mr-md" @drop="handleColumnDrop('selectedDataSeries', true, ...arguments)">
              Series
            </drop>
            <drop class="drop q-mr-md" @drop="handleColumnDrop('selectedSortSeries', true, ...arguments)">
              Sort By
            </drop>
            <drop class="drop" @drop="handleColumnDrop('selectedFilterSeries', false, ...arguments)">
              Filter
            </drop>
            <div class="row q-mt-md">
              <div class="col q-mr-md">
                <div class="text-center"><strong>Series</strong></div>
                <q-list bordered separator class="q-mt-md">
                  <q-item v-for="(itm, idx) in selectedDataSeries" :key="idx" style="cursor: pointer;">
                    <q-item-section>{{ itm.Name }}</q-item-section>
                    <q-item-section side>
                      <q-icon name="close" @click="removeFromArray('selectedDataSeries', idx)" />
                    </q-item-section>
                    <q-popup-edit v-model="itm.IsEditing" @before-hide="computeGraphData(true)">
                      <q-select
                        outlined
                        v-model="itm.AggType"
                        :options="getAggTypes(itm.DataType)"
                        label="Select an aggregation type"
                      />
                      <q-input label="Label" v-model="itm.Label" outlined class="q-my-xs" />
                      <q-input label="Color" v-model="itm.Color" outlined class="q-my-xs">
                        <template v-slot:append>
                          <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy transition-show="scale" transition-hide="scale">
                              <q-color v-model="itm.Color" no-header no-footer />
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                    </q-popup-edit>
                  </q-item>
                </q-list>
              </div>
              <div class="col q-mr-md">
                <div class="text-center"><strong>Sorting</strong></div>
                <q-list bordered separator class="q-mt-md">
                  <q-item v-for="(itm, idx) in selectedSortSeries" :key="idx" style="cursor: pointer;">
                    <q-item-section>{{ itm.Name }}</q-item-section>
                    <q-popup-edit v-model="itm.IsEditing" @before-hide="computeGraphData(true)">
                      <q-select
                        outlined
                        v-model="itm.Sort.Direction"
                        :options="['asc', 'desc']"
                        label="Sort Direction"
                        class="q-my-xs"
                      />
                      <q-select
                        outlined
                        v-model="itm.Sort.Aggregation"
                        :options="['sum', 'none']"
                        label="Sort Aggregation"
                        class="q-my-xs"
                      />
                    </q-popup-edit>
                    <q-item-section side>
                      <q-icon name="close" @click="removeFromArray('selectedSortSeries', idx)" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div class="col">
                <div class="text-center"><strong>Filters</strong></div>
                <q-list bordered separator class="q-mt-md">
                  <q-item v-for="(itm, idx) in selectedFilterSeries" :key="idx" style="cursor: pointer;">
                    <q-item-section>{{ itm.Name }}</q-item-section>
                    <q-popup-edit v-model="itm.IsEditing" @before-hide="computeGraphData(true)">
                      <q-select
                        outlined
                        v-model="itm.Filter.Operator"
                        :options="getFilterTypes(itm.DataType)"
                        label="Filter Operator"
                        class="q-my-xs"
                      />
                      <q-input
                        v-if="itm.Filter.Operator !== 'in'"
                        v-model="itm.Filter.Value"
                        label="Filter Value"
                        class="q-my-xs"
                      />
                      <q-select
                        v-else
                        filled
                        v-model="itm.Filter.SelectedValues"
                        multiple
                        :options="getDistinctValues(itm.Name)"
                        class="q-my-xs"
                      />
                    </q-popup-edit>
                    <q-item-section side>
                      <q-icon name="close" @click="removeFromArray('selectedFilterSeries', idx)" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </div>
          <div class="col-4 q-px-lg">
            <q-file
              v-model="files"
              label="Drop an excel or CSV file here"
              filled
              max-files="1"
              multiple
              clearable
              @input="parseFile"
            >
              <!-- <template v-slot:after>
            <q-btn round dense flat icon="send" @click.prevent="parseFile" />
          </template> -->
            </q-file>
            <q-select
              outlined
              v-model="chartType"
              :options="chartTypeOptions"
              label="Select a chart type"
              class="q-mt-md"
              map-options
              option-label="name"
              option-value="name"
              @input="setChartType"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                  <q-item-section>
                    <q-item-label>{{ capitalize(scope.opt.name) }}</q-item-label>
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
          <div class="col q-px-lg">
            <apexchart
              height="750"
              width="100%"
              :type="chartType.type"
              :options="graphOptions"
              :series="graphData"
            />
          </div>
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[25, 25]">
      <q-btn fab icon="airplay" color="info" @click="parseDataForTable" />
    </q-page-sticky>

    <q-dialog v-model="showTable" full-width>
      <q-card>
        <q-card-section>
          <data-table :table-data="tableData" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCalculatedField" persistent full-width>
      <calculated-field-edit :columns="columnHeaders" :data="flatFileData" @save="saveCalculatedField" />
    </q-dialog>

    <q-inner-loading :showing="isLoading">
      <q-spinner-grid size="125px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script>
import DataTable from "./DataTable";
import CalculatedFieldEdit from "./CalculatedFieldEdit";
import XlsxParseWorker from "@/xlsx-worker/index.js";
import XlsxTableParseWorker from "@/xlsx-table-worker/index.js";
import { date, format } from "quasar";
const { capitalize } = format;

export default {
  components: {
    DataTable,
    CalculatedFieldEdit,
  },
  data() {
    return {
      aggOptions: ["sum", "count", "avg", "max", "min"],
      chartType: { name: "line", icon: "fas fa-chart-line", isCartesian: true },
      chartTypeOptions: [
        { name: "Line", type: "line", icon: "fas fa-chart-line", isCartesian: true },
        { name: "Area", type: "area", icon: "fas fa-chart-area", isCartesian: true },
        { name: "Bar", type: "bar", icon: "fas fa-chart-bar", isCartesian: true },
        { name: "Horizontal Bar", type: "bar", icon: "fas fa-chart-bar", isCartesian: true },
        { name: "Pie", type: "pie", icon: "fas fa-chart-pie", isCartesian: false },
        { name: "Donut", type: "donut", icon: "fas fa-chart-pie", isCartesian: false },
        { name: "PolarArea", type: "polarArea", icon: "fas fa-chart-pie", isCartesian: false },
        { name: "Radar", type: "radar", icon: "fas fa-chart-pie", isCartesian: false },
        { name: "Scatter", type: "scatter", icon: "fas fa-chart-pie", isCartesian: true },
      ],
      baseColorPalette: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
      columnHeaders: [],
      files: [],
      filterOperators: [""],
      flatFileData: [],
      graphData: [
        {
          data: [],
        },
      ],
      graphOptions: {
        chart: {
          id: "vuebi-chart",
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
        colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
      },
      graphSortOptions: {
        column: "",
        type: "asc",
      },
      isLoading: false,
      latestQuery: "",
      selectedDataSeries: [],
      selectedFilterSeries: [],
      selectedSortSeries: [],
      showCalculatedField: false,
      showTable: false,
      tableData: [],
      selectedXaxisDimension: {},
    };
  },
  methods: {
    capitalize,
    getDistinctValues(columnName) {
      const query = `SELECT DISTINCT ${columnName} FROM ?`;
      const result = this.$sql(query, [this.flatFileData]);
      return result.map((itm) => Object.values(itm)[0]).sort();
    },
    queryData(reprocess) {
      let filterClause;

      // Generate the columns to aggregate in the select clause
      let aggClause = this.selectedDataSeries
        .map((itm) => `${itm.AggType}([${itm.Name}]) AS [${itm.Name}]`)
        .reduce((acc, obj) => `${acc}, ${obj}`);

      // If any filters, generate the where clause
      if (
        this.selectedFilterSeries.length > 0 &&
        (this.selectedFilterSeries[0].Filter.Value ||
          this.selectedFilterSeries[0].Filter.SelectedValues.length > 0)
      ) {
        filterClause = this.selectedFilterSeries
          .map((itm) => {
            const colName = `${itm.DataType === "number" ? `[${itm.Name}]` : `LOWER([${itm.Name}])`}`;
            let colValue;
            if (itm.DataType === "number") {
              colValue = itm.Filter.Value;
            } else {
              if (itm.Filter.Operator === "like") {
                colValue = `'%${itm.Filter.Value.toLowerCase()}%'`;
              } else if (itm.Filter.Operator === "in") {
                let inClause = itm.Filter.SelectedValues.reduce((acc, obj) => {
                  if (!acc) {
                    acc = `'${obj.toLowerCase()}'`;
                  } else {
                    acc = `${acc}, '${obj.toLowerCase()}'`;
                  }
                  return acc;
                }, "");
                colValue = `(${inClause})`;
              } else {
                colValue = `'${itm.Filter.Value.toLowerCase()}'`;
              }
            }

            return `${colName} ${itm.Filter.Operator} ${colValue}`;
          })
          .reduce((acc, obj) => {
            if (!acc) {
              acc = `WHERE ${obj}`;
            } else {
              acc = `${acc} AND ${obj}`;
            }
            return acc;
          }, "");
      }

      // Generate the order by clause
      const sortClause =
        this.selectedSortSeries.length > 0
          ? this.selectedSortSeries
              .map((itm) => {
                const sortCol =
                  itm.Sort.Aggregation === "none"
                    ? `[${itm.Name}]`
                    : `${itm.Sort.Aggregation}([${itm.Name}])`;

                return `${sortCol} ${itm.Sort.Direction}`;
              })
              .reduce((acc, obj) => `${acc}, ${obj}`)
          : 1;

      // Compile executed query
      const query = `SELECT [${this.selectedXaxisDimension.Name}], ${aggClause} FROM ? ${
        this.selectedFilterSeries.length > 0 ? filterClause : ""
      } GROUP BY [${this.selectedXaxisDimension.Name}] ORDER BY ${sortClause}`;

      console.log(query);

      // If current query matches previous one, don't re-process
      if (this.latestQuery !== query || reprocess) {
        console.log("Query executed");
        this.latestQuery = query;
        let qResults = this.$sql(query, [this.flatFileData]);

        return this.groupSumBy(qResults, this.selectedXaxisDimension, this.selectedDataSeries);
      } else {
        this.latestQuery = query;
        return false;
      }
    },
    groupSumBy(inputArray, xProp, yProps) {
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
    parseFile() {
      this.isLoading = true;
      XlsxParseWorker.send(this.files[0]);
    },
    processFileResults(headers, typeCheckData) {
      let dataTypeArr = [];
      typeCheckData.map((oRow, oIdx) => {
        if (oIdx > 0) {
          oRow.map((iRow, iIdx) => {
            let t = Object.prototype.toString.call(iRow) === "[object Date]";
            let ft = t === true ? "date" : typeof iRow;

            if (typeof dataTypeArr[iIdx] === "undefined") {
              dataTypeArr[iIdx] = [ft];
            } else {
              dataTypeArr[iIdx].push(ft);
            }
          });
        }
      });
      let dataTypeArrCheck = dataTypeArr.map((row, rIdx) => {
        let type =
          row.filter((v, i, a) => a.indexOf(v) === i).length > 1
            ? "string"
            : row.filter((v, i, a) => a.indexOf(v) === i)[0];

        return {
          Name: typeof headers[rIdx] === "undefined" ? `Column${rIdx}` : headers[rIdx],
          Label: null,
          Color: null,
          DataType: type,
          Sort: {
            Direction: "asc",
            Aggregation: "none",
          },
          Filter: {
            Operator: "=",
            Value: "",
            SelectedValues: [],
          },
          AggType: type === "string" || type === "date" ? "count" : "sum",
        };
      });

      this.columnHeaders = Object.freeze(dataTypeArrCheck);
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
      this.selectedXaxisDimension = data.item;
      this.computeGraphData();
    },
    handleColumnDrop(targetArray, reprocess, transferData) {
      if (!this[targetArray].includes(transferData.item)) {
        this[targetArray].push(transferData.item);
        if (reprocess) {
          this.computeGraphData();
        }
      }
    },
    computeGraphData(reprocess) {
      if (this.selectedXaxisDimension.Name && this.selectedDataSeries.length > 0) {
        this.isLoading = true;

        let queryResults = this.queryData(reprocess);

        if (queryResults) {
          if (!this.chartType.isCartesian) {
            this.graphOptions = {
              labels: Object.keys(queryResults[0]),
            };
            this.graphData = Object.values(queryResults[0]);
          } else {
            this.graphOptions = {
              chart: {
                id: "vuebi-chart",
                animations: {
                  enabled: true,
                },
              },
              plotOptions: {
                bar: {
                  horizontal: this.chartType.name === "Horizontal Bar",
                  dataLabels: {
                    position: "top",
                  },
                },
              },
              xaxis: {
                categories: Object.keys(queryResults[0]),
                labels: {
                  show: true,
                  // rotate: -90,
                  hideOverlappingLabels: true,
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
              colors: this.baseColorPalette,
            };

            this.graphData = queryResults.map((itm, idx) => ({
              data: Object.values(itm),
              name: this.selectedDataSeries[idx].Label ?? this.selectedDataSeries[idx].Name,
            }));
          }
        }

        this.isLoading = false;
      }
    },
    setChartType() {
      if (!this.chartType.isCartesian) {
        this.selectedDataSeries.length = 1;
      }
      this.computeGraphData(true);
    },
    removeFromArray(arrayName, idx) {
      this[arrayName].splice(idx, 1);
      this.computeGraphData(true);
    },
    getAggTypes(dataType) {
      return dataType === "number" ? ["sum", "count", "avg", "max", "min"] : ["count"];
    },
    getFilterTypes(dataType) {
      return dataType === "number" ? ["=", ">", "<", ">=", "<="] : ["=", "like", "in"];
    },
    parseDataForTable() {
      this.showTable = true;
      if (this.tableData.length === 0) {
        XlsxTableParseWorker.send(this.files[0]);
      }
    },
    saveCalculatedField(field) {
      console.log(field.name);
    },
  },
  computed: {
    colDimensions() {
      if (this.columnHeaders.length > 0) {
        return this.columnHeaders
          .filter((x) => x.DataType !== "number")
          .sort((a, b) => a.Name.localeCompare(b.Name));
      }
      return [];
    },
    colValues() {
      if (this.columnHeaders.length > 0) {
        return this.columnHeaders
          .filter((x) => x.DataType === "number")
          .sort((a, b) => a.Name.localeCompare(b.Name));
      }
      return [];
    },
  },
  mounted() {
    XlsxParseWorker.worker.onmessage = (event) => {
      if (event.data.fileData) {
        this.processFileResults(event.data.headers, event.data.typeCheckData);
        this.flatFileData = Object.freeze(event.data.fileData);
        this.isLoading = false;
      }
    };

    XlsxTableParseWorker.worker.onmessage = (event) => {
      if (event.data) {
        this.tableData = event.data;
      }
    };
  },
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
  min-width: 23%;
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

/* Hide scrollbar for Chrome, Safari and Opera */
.q-virtual-scroll::-webkit-scrollbar {
  display: none !important;
}

/* Hide scrollbar for IE, Edge and Firefox */
.q-virtual-scroll {
  -ms-overflow-style: none !important; /* IE and Edge */
  scrollbar-width: none !important; /* Firefox */
}
</style>
