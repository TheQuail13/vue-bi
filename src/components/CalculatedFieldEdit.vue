<template>
  <q-card style="max-width: 75vw !important;">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Add a Calculated Field</div>
      <div v-if="hasRunValidation">
        <q-chip v-if="func.IsValid" icon="verified" color="green" text-color="white" label="Function Valid" />
        <q-chip v-else icon="clear" color="red" text-color="white" label="Error detected" />
      </div>

      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section>
      <div>
        <q-input
          ref="funcName"
          v-model="func.Name"
          label="Name"
          :rules="[(val) => !!val || 'Field name is required']"
        />
      </div>
    </q-card-section>

    <q-card-section class="q-pt-sm">
      <div>
        <drop @drop="handleColumnDrop">
          <q-input
            ref="funcDef"
            v-model="func.CalculationDefinition"
            outlined
            type="textarea"
            label="Field Calculation"
            :rules="[(val) => !!val || 'Field function is required']"
          />
        </drop>
      </div>

      <div class="row">
        <div class="col-4">
          <q-list>
            <h6 class="q-ma-xs text-center"><strong>Columns</strong></h6>
            <q-virtual-scroll style="height: 25vh;" :items="columns">
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
        </div>
        <div class="col-8 ">
          <h6 class="q-ma-xs text-center"><strong>Instructions</strong></h6>
          <div class="q-pl-xl text-center">
            <div v-for="entry in instructions" :key="entry.icon" class="q-mb-md">
              <q-icon :name="entry.icon" size="sm" color="info" /> {{ entry.text }}
            </div>
            <!-- <div>
              <strong>
                Click
                <a href="https://github.com/agershun/alasql/wiki/SQL%20keywords" target="_blank">here</a> for
                a list of supported SQL functions.
              </strong>
            </div> -->
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-actions align="right" class="q-pb-md q-pr-md">
      <q-btn label="Validate" color="orange" @click="isFunctionValid" />
      <q-btn label="Save" color="green" @click="save" />
    </q-card-actions>
  </q-card>
</template>

<script>
export default {
  props: {
    func: {
      type: Object,
      required: false,
      default: () => {
        return {
          Name: "",
          CalculationDefinition: "",
          IsValid: null,
          DataType: "string",
        };
      },
    },
    columns: {
      type: Array,
      required: true,
      default: () => [],
    },
    data: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      hasRunValidation: false,
      instructions: [
        {
          icon: "looks_one",
          text:
            "Use this window to create your own calculated field that will be added to the dataset as a new column.",
        },
        {
          icon: "looks_two",
          text:
            "Once you create a calculated field, it acts just like any column, so it can power a visualization, or you can use it to sort and filter with.",
        },
        {
          icon: "looks_3",
          text:
            "Nearly all accepted SQL functions are accepted, such as case statements, DateAdd(), Month(), Cast(), etc.",
        },
        {
          icon: "looks_4",
          text: `Examples: "DATEADD(year, 1, '2017/08/25')","MONTH([MyDateColumn])", "CASE WHEN [Price] > 1500 THEN 'True' ELSE 'False' END".`,
        },
      ],
    };
  },
  methods: {
    doesColumnNameExist(name) {
      return this.columns.filter((x) => x.Name.toLowerCase() === name.toLowerCase()).length === 0;
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
    getFunctionCursorPosition() {
      const input = this.$refs.funcDef.$refs.input;
      if (input) {
        return input.selectionStart;
      }

      return 0;
    },
    getFunctionDataType() {
      const results = this.$sql(this.funcQuery, [this.data]);

      // loop through each row of data to determine datatype
      let dataTypeArr = [];
      results.map((oRow, oIdx) => {
        const val = Object.values(oRow)[0];
        const dataType = typeof val === "string" && new Date(val) && isNaN(val) ? "date" : typeof val;

        if (typeof dataTypeArr[oIdx] === "undefined") {
          dataTypeArr[oIdx] = [dataType];
        } else {
          dataTypeArr[oIdx].push(dataType);
        }
      });

      // find the distinct datatype values in each column and determine a final column datatype if more than one detected
      let dataTypeConsolidation = dataTypeArr.map((row) => row.filter((v, i, a) => a.indexOf(v) === i)[0]);
      let finalTypes = [...new Set(dataTypeConsolidation)];

      return finalTypes.length > 1 ? "string" : finalTypes[0];
    },
    handleColumnDrop(data) {
      const cursorPos = this.getFunctionCursorPosition();

      this.func.CalculationDefinition =
        this.func.CalculationDefinition.substring(0, cursorPos) +
        `[${data.item.Name}]` +
        this.func.CalculationDefinition.substring(cursorPos, this.func.CalculationDefinition.length);
    },
    async isFunctionValid() {
      this.func.IsValid = await this.validateFunction();
      this.hasRunValidation = true;
    },
    handlerAddEdit(isNameUnique) {
      if (this.func.IsCalculated && isNameUnique) {
        this.$emit("add", this.func);
      } else if (this.func.IsCalculated) {
        this.$emit("update", this.func);
      } else {
        this.$emit("add", this.func);
      }
    },
    save() {
      this.$refs.funcName.validate();
      this.$refs.funcDef.validate();

      if (!this.$refs.funcName.hasError && !this.$refs.funcDef.hasError) {
        let isNameUnique = this.doesColumnNameExist(this.func.Name);

        if (!isNameUnique && !this.func.IsCalculated) {
          this.$q.dialog({
            title: "Error",
            message: "That column name already exists.",
          });
          return;
        }

        this.isFunctionValid().then(() => {
          this.func.DataType = this.getFunctionDataType();
          if (this.func.IsValid) {
            this.handlerAddEdit(isNameUnique);
          } else {
            this.$q
              .dialog({
                title: "Confirm",
                message: "Errors detected. Would you like to save anyway?",
                cancel: {
                  label: "No",
                },
                persistent: true,
              })
              .onOk(() => {
                this.handlerAddEdit(isNameUnique);
              });
          }
        });
      }
    },

    validateFunction() {
      try {
        this.$sql(this.funcQuery, [this.data.slice(0, 10)]);
        return true;
      } catch (err) {
        return false;
      }
    },
  },
  computed: {
    funcQuery() {
      return `SELECT ${this.func.CalculationDefinition} FROM ?`;
    },
  },
};
</script>
