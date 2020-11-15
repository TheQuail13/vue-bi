<template>
  <q-list>
    <q-item-label header class="text-center q-pb-xs">
      <strong>{{ header }}</strong>
    </q-item-label>
    <q-virtual-scroll style="height: 37vh;" :items="columns">
      <template v-slot="{ item, index }">
        <drag style="cursor: move;" :transfer-data="{ item }">
          <q-item :key="index" :class="[`bg-${item.ItemColor}`, 'text-white q-my-xs rounded-borders']">
            <q-item-section>
              <q-item-label class="ellipsis">
                <q-icon :name="getIcon(item.DataType)" class="q-mr-sm" />{{ item.Name }}
              </q-item-label>
              <!-- <q-tooltip
                :delay="750"
                anchor="center right"
                self="center left"
                :offset="[25, 25]"
                :content-class="'text-h6'"
              >
                {{ item.Name }}
              </q-tooltip> -->
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
