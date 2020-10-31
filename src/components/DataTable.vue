<template>
  <div>
    <q-table title="Raw Data Preview" :data="tableData" :pagination="tablePagination" />
    <q-inner-loading :showing="tableData.length === 0">
      <q-spinner-grid size="125px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script>
export default {
  props: {
    tableData: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      tablePagination: {
        rowsPerPage: 10,
      },
    };
  },
};
</script>
