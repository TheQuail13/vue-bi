<template>
  <q-card style="max-width: 75vw !important;">
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">Calculated Field</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section class="q-py-none">
      <q-chip round icon="done" color="green" text-color="white" label="Function Valid" />
    </q-card-section>

    <q-card-section class="q-pt-sm">
      <div>
        <q-input v-model="functionDefinition" outlined type="textarea" />
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
      functionDefinition: "",
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
    validateFunction() {
      const query = `SELECT ${this.functionDefinition} FROM ?`;
      try {
        this.$sql(query, [this.flatFileData.slice(0, 25)]);
        // console.log("results: ", results);
        this.isError = false;
      } catch (err) {
        // console.log("err: ", err);
        this.isError = true;
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
