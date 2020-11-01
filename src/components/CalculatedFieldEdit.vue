<template>
  <q-card style="max-width: 75vw !important;">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Add a Calculated Field</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section>
      <div>
        <q-input
          ref="funcName"
          v-model="func.name"
          label="Name"
          :rules="[(val) => !!val || 'Field name is required']"
        />
      </div>
    </q-card-section>

    <q-card-section v-if="hasRunValidation" class="q-py-none">
      <q-chip v-if="func.isValid" icon="verified" color="green" text-color="white" label="Function Valid" />
      <q-chip v-else icon="clear" color="red" text-color="white" label="Error detected" />
    </q-card-section>

    <q-card-section class="q-pt-sm">
      <div>
        <drop @drop="handleColumnDrop">
          <q-input
            ref="funcDef"
            v-model="func.definition"
            outlined
            type="textarea"
            :rules="[(val) => !!val || 'Field function is required']"
          />
        </drop>
      </div>

      <div class="row">
        <div class="col-4">
          <q-list>
            <q-item-label header><strong>Columns</strong></q-item-label>
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
        <div class="col-8">
          <q-item-label class="q-mt-xl q-pl-xl text-center">
            <h5>
              Click
              <a href="https://github.com/agershun/alasql/wiki/SQL%20keywords" target="_blank">here</a> for a
              list of supported SQL functions.
            </h5>
          </q-item-label>
        </div>
      </div>
    </q-card-section>
    <q-card-actions align="right" class="q-pb-md q-pr-md">
      <q-btn label="cancel" color="red" v-close-popup />
      <q-btn label="Validate" color="orange" @click="validateFunctionSyntax" />
      <q-btn label="Save" color="green" @click="save" />
    </q-card-actions>
  </q-card>
</template>

<script>
export default {
  props: {
    columns: {
      type: Array,
      required: true,
      default: () => [],
    },
    data: {
      type: Array,
      required: true,
      default: () => {},
    },
  },
  data() {
    return {
      func: {
        name: "",
        definition: "",
        isValid: null,
      },

      hasRunValidation: false,
    };
  },
  methods: {
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
    handleColumnDrop(data) {
      const cursorPos = this.getFunctionCursorPosition();
      this.func.definition =
        this.func.definition.substring(0, cursorPos) +
        `[${data.item.Name}]` +
        this.func.definition.substring(cursorPos + 1, this.func.definition.length);
    },
    async validateFunction() {
      const query = `SELECT ${this.func.definition} FROM ?`;
      try {
        this.$sql(query, [this.data.slice(0, 25)]);
        // console.log("results: ", results);
        return true;
      } catch (err) {
        // console.log("err: ", err);
        return false;
      }
    },
    async validateFunctionSyntax() {
      this.func.isValid = await this.validateFunction();
      this.hasRunValidation = true;
    },
    save() {
      this.$refs.funcName.validate();
      this.$refs.funcDef.validate();

      if (!this.$refs.funcName.hasError && !this.$refs.funcDef.hasError) {
        this.validateFunctionSyntax().then(() => {
          if (this.func.isValid) {
            this.$emit("save", this.func);
          } else {
            this.$q
              .dialog({
                title: "Confirm",
                message: "Errors detected. Would you like to save anyway?",
                cancel: true,
                persistent: true,
              })
              .onOk(() => {
                this.$emit("save", this.func);
              });
          }
        });
      }
    },
  },
};
</script>
