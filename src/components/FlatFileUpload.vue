<template>
  <div class="row justify-center items-center" style="height: 90vh;">
    <q-card style="border-radius: 1.5em;">
      <drop class="drop" @drop="handleFileDrop">
        <h4>Drop an Excel or CSV file here to begin</h4>
      </drop>
    </q-card>
  </div>
</template>

<script>
export default {
  methods: {
    handleFileDrop(data, event) {
      event.preventDefault();
      const files = event.dataTransfer.files;
      const fileList = [];
      for (let i = 0; i < files.length; i++) {
        fileList.push(files.item(i));
      }

      this.$emit("upload", fileList);
    },
  },
};
</script>

<style lang="scss" scoped>
.drop {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ccc;
  width: 50vw;
  height: 50vh;
}

.drop:hover {
  border: 3px dashed;
}
</style>
