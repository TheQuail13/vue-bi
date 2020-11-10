<template>
  <q-page padding class="main-page">
    <div class="row justify-center q-col-gutter-md">
      <div id="first-col" class="col-2">
        <q-select
          outlined
          v-model="chartType"
          :options="chartTypeOptions"
          label="Select a chart type"
          class="q-mb-lg"
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
        <q-input dense v-model="colSearchTerm" class="q-mt-md" label="Search for a column" clearable filled />
        <column-list
          header="Dimensions"
          :columns="colDimensions"
          @editcalculatedfield="editCalculatedField"
        />

        <q-separator size="2px" class="row-resizer" />

        <column-list header="Values" :columns="colValues" @editcalculatedfield="editCalculatedField" />
        <q-btn
          color="orange"
          label="Add Calculated Field"
          class="full-width q-mt-md"
          @click="showCalculatedField = true"
        />
      </div>
      <div id="middle-col" class="col-2">
        <q-item-label header class="text-center q-pb-xs q-pt-none">
          <strong>Filter</strong>
        </q-item-label>
        <drop class="full-width drop" @drop="handleColumnDrop('selectedFilterSeries', false, ...arguments)">
          <strong>Drop a column</strong>
        </drop>
        <q-virtual-scroll style="height: 25vh;" :items="selectedFilterSeries" separator>
          <template v-slot="{ item, index }">
            <q-item
              :key="index"
              style="cursor: pointer; border-radius: 3px;"
              :class="[`bg-${item.ItemColor}`, 'text-white q-my-sm']"
              @mouseover="item.Filter.showRemoveIcon = true"
              @mouseleave="item.Filter.showRemoveIcon = false"
            >
              <q-item-section>{{ item.Name }}</q-item-section>
              <q-item-section side v-if="item.Filter.Value" class="text-white">{{
                item.Filter.Operator
              }}</q-item-section>
              <q-item-section
                side
                v-if="item.Filter.showRemoveIcon"
                @click="removeFromArray('selectedFilterSeries', index)"
              >
                <q-icon name="close" color="white" />
              </q-item-section>
              <q-popup-edit v-model="item.IsEditing" @before-hide="constructQuery(true)" anchor="top left">
                <q-select
                  outlined
                  v-model="item.Filter.Operator"
                  :options="getFilterTypes(item.DataType)"
                  label="Filter Operator"
                  class="q-my-xs"
                />
                <q-input
                  v-if="item.Filter.Operator !== 'in'"
                  v-model="item.Filter.Value"
                  label="Filter Value"
                  class="q-my-xs"
                />
                <q-select
                  v-else
                  filled
                  v-model="item.Filter.SelectedValues"
                  multiple
                  :options="getDistinctValues(item)"
                  class="q-my-xs"
                />
              </q-popup-edit>
            </q-item>
          </template>
        </q-virtual-scroll>

        <q-separator size="2px" class="row-resizer" />

        <q-item-label header class="text-center q-pt-md q-pb-xs">
          <strong>Sorting</strong>
        </q-item-label>
        <drop class="full-width drop" @drop="handleColumnDrop('selectedSortSeries', true, ...arguments)">
          <strong>Drop a column</strong>
        </drop>
        <q-virtual-scroll style="height: 40vh;" :items="selectedSortSeries" separator>
          <template v-slot="{ item, index }">
            <q-item
              :key="index"
              style="cursor: pointer; border-radius: 3px;"
              :class="[`bg-${item.ItemColor}`, 'text-white q-my-xs']"
              @mouseover="item.Sort.showRemoveIcon = true"
              @mouseleave="item.Sort.showRemoveIcon = false"
            >
              <q-item-section>{{ item.Name }}</q-item-section>
              <q-popup-edit v-model="item.IsEditing" @before-hide="constructQuery(true)">
                <q-select
                  outlined
                  v-model="item.Sort.Direction"
                  :options="['asc', 'desc']"
                  label="Sort Direction"
                  class="q-my-xs"
                />
                <q-select
                  outlined
                  v-model="item.Sort.Aggregation"
                  :options="['sum', 'none']"
                  label="Sort Aggregation"
                  class="q-my-xs"
                />
              </q-popup-edit>
              <q-item-section side>
                <q-icon
                  :name="item.Sort.Direction === 'asc' ? 'fas fa-sort-amount-up' : 'fas fa-sort-amount-down'"
                  color="white"
                  size="xs"
                />
              </q-item-section>
              <q-item-section
                side
                v-if="item.Sort.showRemoveIcon"
                @click="removeFromArray('selectedSortSeries', index)"
              >
                <q-icon name="close" color="white" />
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
      </div>
      <div id="third-col" class="col-8">
        <div class="row">
          <div class="col-3 q-pr-xs">
            <q-item-label header class="q-pb-xs q-pt-none">
              <strong>X-Axis</strong>
            </q-item-label>
            <drop class="bg-grey-4 series-drop" @drop="handleXDrop">
              <q-item
                :class="[
                  'col-3 rounded-borders',
                  `bg-${selectedXaxisDimension ? selectedXaxisDimension.ItemColor : null}`,
                  !selectedXaxisDimension ? 'text-center' : null,
                ]"
              >
                <q-item-section :class="[selectedXaxisDimension ? 'text-white' : null]">
                  <strong>{{ selectedXaxisDimension ? selectedXaxisDimension.Name : "X-Axis" }}</strong>
                </q-item-section>
                <q-item-section
                  v-if="selectedXaxisDimension"
                  side
                  class="cursor-pointer"
                  @click="removeXaxisValue"
                >
                  <q-icon name="close" color="white" />
                </q-item-section>
              </q-item>
            </drop>
          </div>
          <div class="col-9">
            <q-item-label header class="q-pb-xs q-pt-none">
              <strong>Series</strong>
            </q-item-label>
            <div class="row q-col-gutter-xs">
              <div class="col-4" v-for="(itm, idx) in selectedDataSeries" :key="idx">
                <q-item
                  style="cursor: pointer;"
                  :class="[`bg-${itm.ItemColor}`, 'text-white rounded-borders']"
                >
                  <q-item-section>
                    <strong>{{ itm.Name }}</strong>
                  </q-item-section>
                  <q-item-section side @click="removeFromArray('selectedDataSeries', idx)">
                    <q-icon name="close" color="white" />
                  </q-item-section>
                  <q-popup-edit v-model="itm.IsEditing" @hide="constructQuery(true)">
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
              </div>
              <div class="col-4" v-if="isSeriesDropDisplayed">
                <drop
                  class="bg-grey-4 series-drop"
                  @drop="handleColumnDrop('selectedDataSeries', true, ...arguments)"
                >
                  <q-item class="col-3">
                    <q-item-section class="text-center"><strong>Drop a column</strong></q-item-section>
                  </q-item>
                </drop>
              </div>
            </div>
          </div>
        </div>

        <q-separator size="2px" class="q-my-md" />

        <Chart
          :is-loading="isLoading"
          :chart-type="chartType.type"
          :options="graphOptions"
          :data="graphData"
        />
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[25, 25]">
      <q-btn fab icon="table_view" color="info" @click="parseDataForTable" />
    </q-page-sticky>

    <q-dialog v-model="showTable" full-width>
      <q-card v-if="showTable">
        <q-card-section>
          <data-table :table-data="tableData" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog ref="cfEditor" v-model="showCalculatedField" persistent full-width>
      <calculated-field-edit
        :func="calculatedFieldToEdit"
        :columns="columns"
        :data="flatFileData"
        @add="saveCalculatedField"
        @update="updateCalculatedField"
      />
    </q-dialog>

    <q-inner-loading :showing="flatFileData.length === 0">
      <q-spinner-grid size="125px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script>
// Components
import CalculatedFieldEdit from "./CalculatedFieldEdit";
import ColumnList from "./ColumnList";
import Chart from "./Chart";

// Web Workers
import XlsxParseWorker from "@/workers/xlsx-worker/index.js";
import XlsxTableParseWorker from "@/workers/xlsx-table-worker/index.js";
import QueryWorker from "@/workers/query-worker/index.js";

// Helpers
import { date, format } from "quasar";
const { capitalize } = format;

export default {
  components: {
    DataTable: () => import("./DataTable"),
    CalculatedFieldEdit,
    ColumnList,
    Chart,
  },
  props: {
    file: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      aggOptions: ["sum", "count", "avg", "max", "min"],
      baseColorPalette: ["#33b8ff", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
      calculatedFieldToEdit: {},
      columns: [],
      chartType: { name: "line", type: "line", icon: "fas fa-chart-line", isCartesian: true },
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
      colSearchTerm: "",
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
      previousChartType: {},
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
    getDistinctValues(column) {
      const query = `SELECT DISTINCT ${
        !column.IsCalculated ? column.Name : column.CalculationDefinition
      } FROM ?`;
      const result = this.$sql(query, [this.flatFileData]);
      return result.map((itm) => Object.values(itm)[0]).sort();
    },
    constructQuery(reprocess) {
      if (this.selectedXaxisDimension && this.selectedDataSeries.length > 0) {
        this.isLoading = true;
        let filterClause;
        let filterCheck =
          this.selectedFilterSeries.length > 0 &&
          (this.selectedFilterSeries[0].Filter.Value ||
            this.selectedFilterSeries[0].Filter.SelectedValues.length > 0);

        // Generate the columns to aggregate in the select clause
        let selectClause = this.selectedDataSeries
          .map((itm) => {
            if (!itm.IsCalculated) {
              return `${itm.AggType}([${itm.Name}]) AS [${itm.Name}]`;
            } else {
              return `${itm.AggType}(${itm.CalculationDefinition}) AS [${itm.Name}]`;
            }
          })
          .reduce((acc, obj) => `${acc}, ${obj}`);

        // If any filters, generate the where clause
        if (filterCheck) {
          filterClause = this.selectedFilterSeries
            .map((itm) => {
              let colName;
              let colValue;

              if (!itm.IsCalculated) {
                colName = `${itm.DataType === "number" ? `[${itm.Name}]` : `LOWER([${itm.Name}])`}`;
              } else {
                colName = itm.CalculationDefinition;
              }

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
        const query = `SELECT [${this.selectedXaxisDimension.Name}], ${selectClause} FROM ? ${
          filterCheck ? filterClause : ""
        } GROUP BY [${this.selectedXaxisDimension.Name}] ORDER BY ${sortClause}`;

        console.log(query);

        // If current query matches previous one, don't re-process
        if (this.latestQuery !== query || reprocess) {
          this.latestQuery = query;
          QueryWorker.send({ query: query, data: this.flatFileData });
        } else {
          this.latestQuery = query;
        }
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
      XlsxParseWorker.send(this.file[0]);
    },
    processFileResults(headers, typeCheckData) {
      // loop through each row of data to determine datatype
      let dataTypeArr = [];
      typeCheckData.map((oRow, oIdx) => {
        if (oIdx > 0) {
          oRow.map((iRow, iIdx) => {
            const dataType = Object.prototype.toString.call(iRow) === "[object Date]" ? "date" : typeof iRow;

            if (typeof dataTypeArr[iIdx] === "undefined") {
              dataTypeArr[iIdx] = [dataType];
            } else {
              dataTypeArr[iIdx].push(dataType);
            }
          });
        }
      });

      // find the distinct datatype values in each column and determine a final column datatype
      let dataTypeArrCheck = dataTypeArr.map((row, rIdx) => {
        let type =
          row.filter((v, i, a) => a.indexOf(v) === i).length > 1
            ? "string"
            : row.filter((v, i, a) => a.indexOf(v) === i)[0];

        return {
          Name: typeof headers[rIdx] === "undefined" ? `Column${rIdx}` : headers[rIdx],
          IsCalculated: false,
          Label: null,
          Color: null,
          DataType: type,
          Sort: {
            showRemoveIcon: false,
            Direction: "asc",
            Aggregation: "none",
          },
          Filter: {
            showRemoveIcon: false,
            Operator: "=",
            Value: "",
            SelectedValues: [],
          },
          AggType: type === "string" || type === "date" ? "count" : "sum",
          ItemColor: this.getColorByDataType(type),
        };
      });

      this.columns = dataTypeArrCheck;
    },
    selectInitialGraphData() {
      const xAxisIdx = this.getRandomInt(0, this.colDimensions.length);
      const dataSeriesIdx = this.getRandomInt(0, this.colValues.length);

      this.selectedXaxisDimension = this.colDimensions[xAxisIdx];
      this.selectedDataSeries.push(this.colValues[dataSeriesIdx]);

      this.constructQuery();
    },
    getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    },
    editCalculatedField(field) {
      this.calculatedFieldToEdit = JSON.parse(JSON.stringify(field));
      this.showCalculatedField = true;
    },
    handleXDrop(data) {
      this.selectedXaxisDimension = data.item;
      this.constructQuery();
    },
    handleColumnDrop(targetArray, reprocess, transferData) {
      if (!this[targetArray].includes(transferData.item)) {
        this[targetArray].push(transferData.item);
        if (reprocess) {
          this.constructQuery();
        }
      }
    },
    computeGraphData(queryResults) {
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
                enabled: false,
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
        this.isLoading = false;
      }
    },
    setChartType(chart) {
      if (this.previousChartType.name !== chart.name) {
        this.previousChartType = chart;
        if (!chart.isCartesian) {
          this.selectedDataSeries.length = 1;
        }
        this.constructQuery(true);
      }
    },
    removeFromArray(arrayName, idx) {
      this[arrayName].splice(idx, 1);
      this.constructQuery(true);
    },
    removeXaxisValue() {
      this.selectedXaxisDimension = null;
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
        XlsxTableParseWorker.send(this.file[0]);
      }
    },
    saveCalculatedField(field) {
      let columnToAdd = {
        Name: field.Name,
        IsCalculated: true,
        CalculationDefinition: field.CalculationDefinition,
        IsValid: field.IsValid,
        Label: null,
        Color: null,
        DataType: field.DataType,
        Sort: {
          showRemoveIcon: false,
          Direction: "asc",
          Aggregation: "none",
        },
        Filter: {
          showRemoveIcon: false,
          Operator: "=",
          Value: "",
          SelectedValues: [],
        },
        AggType: field.DataType === "string" || field.DataType === "date" ? "count" : "sum",
        ItemColor: this.getColorByDataType(field.DataType),
      };

      this.columns.push(columnToAdd);
      this.$refs.cfEditor.hide();
    },
    getColorByDataType(type) {
      if (type === "string" || type === "date") {
        return "blue-6";
      }
      return "green-6";
    },
    updateCalculatedField(field) {
      const fieldIndex = this.columns.findIndex((x) => x.Name === field.Name);
      this.$set(this.columns, fieldIndex, field);

      this.$refs.cfEditor.hide();
    },
    mountWorkers() {
      XlsxParseWorker.worker.onmessage = (event) => {
        if (event.data.fileData) {
          this.processFileResults(event.data.headers, event.data.typeCheckData);
          this.flatFileData = Object.freeze(event.data.fileData);
          this.selectInitialGraphData();
        }
      };

      XlsxTableParseWorker.worker.onmessage = (event) => {
        if (event.data) {
          this.tableData = event.data;
        }
      };

      QueryWorker.worker.onmessage = (event) => {
        if (event.data) {
          const results = this.groupSumBy(event.data, this.selectedXaxisDimension, this.selectedDataSeries);
          this.computeGraphData(results);
        }
      };
    },
  },
  computed: {
    colDimensions() {
      if (this.columns.length > 0) {
        return this.columns
          .filter((x) =>
            !this.colSearchTerm
              ? x.DataType !== "number"
              : x.DataType !== "number" &&
                x.Name.toLowerCase().indexOf(this.colSearchTerm.toLowerCase()) !== -1
          )
          .sort((a, b) => a.Name.localeCompare(b.Name));
      }
      return [];
    },
    colValues() {
      if (this.columns.length > 0) {
        return this.columns
          .filter((x) =>
            !this.colSearchTerm
              ? x.DataType === "number"
              : x.DataType === "number" &&
                x.Name.toLowerCase().indexOf(this.colSearchTerm.toLowerCase()) !== -1
          )
          .sort((a, b) => a.Name.localeCompare(b.Name));
      }
      return [];
    },
    isSeriesDropDisplayed() {
      if (!this.chartType.isCartesian && this.selectedDataSeries.length > 0) {
        return false;
      }
      return true;
    },
  },

  mounted() {
    this.mountWorkers();
  },

  destroyed() {
    XlsxParseWorker.worker.terminate();
    XlsxTableParseWorker.worker.terminate();
    QueryWorker.worker.terminate();
  },

  watch: {
    file: {
      handler() {
        this.parseFile();
      },
      immediate: true,
    },
  },
};
</script>

<style>
.drop {
  border-radius: 3px;
  padding: 14px;
  text-align: center;
  background: #e0e0e0;
}

.series-drop {
  border-radius: 3px;
  background: #e0e0e0;
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

#first-col {
  padding-right: 1.5em !important;
}

#middle-col {
  padding-left: 1.5em !important;
  padding-right: 1.5em !important;
  border-left: 2px lightgrey solid;
  border-right: 2px lightgrey solid;
}

#third-col {
  padding-left: 1.5em !important;
}

/* .row-resizer {
  cursor: row-resize;
}

.column-resizer {
  cursor: col-resize;
} */
</style>
