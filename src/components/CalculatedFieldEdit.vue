<template>
  <q-card style="max-width: 75vw !important;">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Add a Calculated Field</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section>
      <div>
        <q-input v-model="func.name" label="Name" />
      </div>
    </q-card-section>

    <q-card-section v-if="!isError === false" class="q-py-none">
      <q-chip round icon="done" color="green" text-color="white" label="Function Valid" />
    </q-card-section>

    <q-card-section class="q-pt-sm">
      <div>
        <drop @drop="handleColumnDrop">
          <q-input ref="funcInputForm" v-model="func.definition" outlined type="textarea" />
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
          <q-item-label class="q-mt-xl q-pl-xl">
            Click
            <a href="https://github.com/agershun/alasql/wiki/SQL%20keywords" target="_blank">here</a> for a
            list of supported functions.
          </q-item-label>
        </div>
      </div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn label="cancel" color="red" v-close-popup />
      <q-btn label="Save" color="green" @click="validateFunction" />
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
  },
  data() {
    return {
      func: {
        name: "",
        definition: "",
      },
      isError: null,
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
      const input = this.$refs.funcInputForm.$refs.input;
      if (input) {
        return input.selectionStart;
      }

      return 0;
    },
    validateFunction() {
      const query = `SELECT ${this.func.definition} FROM ?`;
      try {
        this.$sql(query, [this.flatFileData.slice(0, 25)]);
        // console.log("results: ", results);
        this.isError = false;
      } catch (err) {
        // console.log("err: ", err);
        this.isError = true;
      }
    },
    handleColumnDrop(data) {
      const cursorPos = this.getFunctionCursorPosition();
      this.func.definition =
        this.func.definition.substring(0, cursorPos) +
        `[${data.item.Name}]` +
        this.func.definition.substring(cursorPos + 1, this.func.definition.length);
    },
  },
};
</script>
