<template>
  <div style="height: 75vh;">
    <apexchart
      ref="vuebiChart"
      height="100%"
      width="100%"
      :type="chartType"
      :options="options"
      :series="data"
    />
    <q-inner-loading :showing="isLoading">
      <q-spinner-grid size="125px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script>
export default {
  props: {
    isLoading: {
      type: Boolean,
      required: false,
      default: false,
    },
    chartType: {
      type: String,
      required: false,
      default: "line",
    },
    options: {
      type: Object,
      required: true,
      default: () => {},
    },
    data: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
};
</script>
