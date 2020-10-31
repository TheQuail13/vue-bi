import Vue from 'vue'
import App from './App.vue'
import './quasar'
import VueApexCharts from 'vue-apexcharts'
import VueDragDrop from 'vue-drag-drop';

Vue.component('apexchart', VueApexCharts)

Vue.use(VueDragDrop);
Vue.use(VueApexCharts)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
