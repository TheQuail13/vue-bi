<template>
  <q-page padding class="main-page">
    <div class="row justify-center q-mb-lg">
      <div class="col-3 q-px-md">
        <q-list>
          <q-virtual-scroll style="max-height: 300px;" :items="columnHeaders">
            <template v-slot="{ item, index }">
              <drag style="cursor: move;" :transfer-data="{ item }">
                <q-item :key="index" clickable class="bg-primary text-white q-my-xs rounded-borders">
                  <q-item-section>
                    <q-item-label> <q-icon :name="getIcon(item.Type)" /> {{ item.Name }} </q-item-label>
                  </q-item-section>
                </q-item>
              </drag>
            </template>
          </q-virtual-scroll>
        </q-list>
      </div>
      <div class="col-7 q-px-lg">
        <drop class="drop q-mr-md" @drop="handleXDrop">{{ xAxis.Name ? xAxis.Name : "X-Axis" }}</drop>
        <drop class="drop q-mr-md" @drop="handleYDrop">Series</drop>
        <drop class="drop q-mr-md" @drop="handleSortDrop">Sort By</drop>
        <drop class="drop" @drop="handleFilterDrop">Filter</drop>
        <div class="row q-mt-md">
          <div class="col q-mr-md">
            <div class="text-center"><strong>Series</strong></div>
            <q-list bordered separator class="q-mt-md">
              <q-item v-for="(itm, idx) in droppedArray" :key="idx" style="cursor: pointer;">
                <q-item-section>{{ itm.Name }}</q-item-section>
                <q-item-section side>
                  <q-icon name="close" @click="removeFromDropped(idx)" />
                </q-item-section>
                <q-popup-edit v-model="itm.IsEditing" @before-hide="computeGraphData(true)">
                  <q-select
                    outlined
                    v-model="itm.AggType"
                    :options="getAggTypes(itm.Type)"
                    label="Select an aggregation type"
                  />
                  <q-input label="Label" v-model="itm.Label" outlined class="q-my-xs" />
                  <q-input label="Color" outlined class="q-my-xs" />
                </q-popup-edit>
              </q-item>
            </q-list>
          </div>
          <div class="col q-mr-md">
            <div class="text-center"><strong>Sorting</strong></div>
            <q-list bordered separator class="q-mt-md">
              <q-item v-for="(itm, idx) in droppedSortArray" :key="idx" style="cursor: pointer;">
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
                  <q-icon name="close" @click="removeFromDroppedSort(idx)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="col">
            <div class="text-center"><strong>Filters</strong></div>
            <q-list bordered separator class="q-mt-md">
              <q-item v-for="(itm, idx) in droppedFilterArray" :key="idx" style="cursor: pointer;">
                <q-item-section>{{ itm.Name }}</q-item-section>
                <q-popup-edit v-model="itm.IsEditing" @before-hide="computeGraphData(true)">
                  <q-select
                    outlined
                    v-model="itm.Filter.Operator"
                    :options="getFilterTypes(itm.Type)"
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
                  <q-icon name="close" @click="removeFromDroppedFilter(idx)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
      <div class="col-2 q-px-lg">
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
      <!-- <div class="col q-px-lg">
        <q-table title="Raw Data Preview" :data="tableData" :pagination="pagination" />
      </div> -->
      <div class="col q-px-lg">
        <apexchart
          height="750"
          width="100%"
          :type="chartType.name"
          :options="graphOptions"
          :series="graphData"
        ></apexchart>
      </div>
    </div>
    <q-inner-loading :showing="isLoading">
      <q-spinner-grid size="125px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script>
import ParseWorker from "@/xlsx-worker/index.js";
import alasql from "alasql";
import { date, format } from "quasar";
const { capitalize } = format;

export default {
  data() {
    return {
      isLoading: false,
      files: [],
      chartType: { name: "line", icon: "fas fa-chart-line" },
      chartTypeOptions: [
        { name: "line", icon: "fas fa-chart-line" },
        { name: "area", icon: "fas fa-chart-area" },
        { name: "bar", icon: "fas fa-chart-bar" },
        { name: "pie", icon: "fas fa-chart-pie" },
        { name: "donut", icon: "fas fa-chart-pie" },
        { name: "polarArea", icon: "fas fa-chart-pie" },
        { name: "radar", icon: "fas fa-chart-pie" },
        { name: "scatter", icon: "fas fa-chart-pie" },
      ],
      aggOptions: ["sum", "count", "avg", "max", "min"],
      filterOperators: [""],
      columnHeaders: [],
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
      flatFileData: [],
      droppedArray: [],
      droppedSortArray: [],
      droppedFilterArray: [],
      xAxis: {},
      pagination: {
        rowsPerPage: 10,
      },
      latestQuery: "",
    };
  },
  methods: {
    capitalize,
    getDistinctValues(columnName) {
      const query = `SELECT DISTINCT ${columnName} FROM ?`;
      const result = alasql(query, [this.flatFileData]);
      return result.map((itm) => Object.values(itm)[0]).sort();
    },
    queryData(reprocess, inputArray, xProp, yProps, sortProps, filterProps) {
      let filterClause;

      // Generate the columns to aggregate in the select clause
      let aggClause = yProps
        .map((itm) => `${itm.AggType}([${itm.Name}]) AS [${itm.Name}]`)
        .reduce((acc, obj) => `${acc}, ${obj}`);

      // If any filters, generate the where clause
      if (
        filterProps.length > 0 &&
        (filterProps[0].Filter.Value || filterProps[0].Filter.SelectedValues.length > 0)
      ) {
        filterClause = filterProps
          .map((itm) => {
            const colName = `${itm.Type === "number" ? `[${itm.Name}]` : `LOWER([${itm.Name}])`}`;
            let colValue;
            if (itm.Type === "number") {
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
        sortProps.length > 0
          ? sortProps
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
      const query = `SELECT [${xProp.Name}], ${aggClause} FROM ? ${
        filterProps.length > 0 ? filterClause : ""
      } GROUP BY [${xProp.Name}] ORDER BY ${sortClause}`;

      console.log(query);

      // If current query matches previous one, don't re-process
      if (this.latestQuery !== query || reprocess) {
        this.latestQuery = query;
        let qResults = alasql(query, [inputArray]);
        return this.groupSumBy(qResults, xProp, yProps);
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
      ParseWorker.send(this.files[0]);
    },
    processFileResults(headers, typeCheckData) {
      let tArr = [];
      typeCheckData.map((oRow, oIdx) => {
        if (oIdx > 0) {
          oRow.map((iRow, iIdx) => {
            let t = Object.prototype.toString.call(iRow) === "[object Date]";
            let ft = t === true ? "date" : typeof iRow;

            if (typeof tArr[iIdx] === "undefined") {
              tArr[iIdx] = [ft];
            } else {
              tArr[iIdx].push(ft);
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
          Label: null,
          Type: type,
          Sort: {
            Direction: "asc",
            Aggregation: "none",
          },
          Filter: {
            Operator: "=",
            Value: "",
            SelectedValues: [],
          },
          AggType: type === "string" ? "count" : "sum",
        };
      });

      this.columnHeaders = Object.freeze(tArrCheck);
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
    handleFilterDrop(data) {
      if (!this.droppedFilterArray.includes(data.item)) {
        this.droppedFilterArray.push(data.item);
      }
    },
    computeGraphData(reprocess) {
      if (this.xAxis.Name && this.droppedArray.length > 0) {
        this.isLoading = true;

        let queryResults = this.queryData(
          reprocess,
          this.flatFileData,
          this.xAxis,
          this.droppedArray,
          this.droppedSortArray,
          this.droppedFilterArray
        );

        if (queryResults) {
          if (
            this.chartType.name === "pie" ||
            this.chartType.name === "donut" ||
            this.chartType.name === "polarArea" ||
            this.chartType.name === "radar"
          ) {
            this.graphData = Object.values(queryResults[0]);
          } else {
            this.graphData = queryResults.map((itm, idx) => ({
              data: Object.values(itm),
              name: this.droppedArray[idx].Label ?? this.droppedArray[idx].Name,
            }));
          }

          if (
            this.chartType.name === "pie" ||
            this.chartType.name === "donut" ||
            this.chartType.name === "polarArea" ||
            this.chartType.name === "radar"
          ) {
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
            };
          }
        }

        this.isLoading = false;
      }
    },
    setChartType() {
      if (
        this.chartType.name === "pie" ||
        this.chartType.name === "donut" ||
        this.chartType.name === "polarArea" ||
        this.chartType.name === "radar"
      ) {
        this.droppedArray.length = 1;
      }
      this.computeGraphData(true);
    },
    removeFromDropped(idx) {
      this.droppedArray.splice(idx, 1);
      this.computeGraphData();
    },
    removeFromDroppedSort(idx) {
      this.droppedSortArray.splice(idx, 1);
      this.computeGraphData();
    },
    removeFromDroppedFilter(idx) {
      this.droppedFilterArray.splice(idx, 1);
      this.computeGraphData();
    },
    getAggTypes(dataType) {
      return dataType === "number" ? ["sum", "count", "avg", "max", "min"] : ["count"];
    },
    getFilterTypes(dataType) {
      return dataType === "number" ? ["=", ">", "<", ">=", "<="] : ["=", "like", "in"];
    },
  },
  mounted() {
    ParseWorker.worker.onmessage = (event) => {
      if (event.data.fileData) {
        this.processFileResults(event.data.headers, event.data.typeCheckData);
        this.flatFileData = Object.freeze(event.data.fileData);
        this.isLoading = false;
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
