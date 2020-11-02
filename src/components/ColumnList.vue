<template>
  <q-list>
    <q-item-label header>
      <strong>{{ header }}</strong>
    </q-item-label>
    <q-virtual-scroll style="height: 40vh;" :items="columns">
      <template v-slot="{ item, index }">
        <drag style="cursor: move;" :transfer-data="{ item }">
          <q-item :key="index" :class="[`bg-${color}`, 'text-white q-my-xs rounded-borders']">
            <q-item-section>
              <q-item-label>
                <q-icon :name="getIcon(item.DataType)" class="q-mr-sm" />{{ item.Name }}
              </q-item-label>
            </q-item-section>
            <q-item-section v-if="item.IsCalculated" side>
              <q-icon
                name="edit"
                color="white"
                class="q-mr-sm"
                style="cursor: pointer;"
                @click="editCalculatedField(item)"
              />
            </q-item-section>
          </q-item>
        </drag>
      </template>
    </q-virtual-scroll>
  </q-list>
</template>

<script>
export default {
  props: {
    header: {
      type: String,
      default: "Columns",
    },
    columns: {
      type: Array,
      required: true,
      default: () => [],
    },
    color: {
      type: String,
      default: "green",
    },
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
    editCalculatedField(field) {
      this.$emit("editcalculatedfield", field);
    },
  },
};
</script>
