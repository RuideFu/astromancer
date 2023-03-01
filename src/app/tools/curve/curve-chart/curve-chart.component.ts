import {AfterViewInit, Component, EventEmitter, Injector, OnInit} from '@angular/core';
import {Chart, LinearScaleOptions} from "chart.js";
import {ChartConfiguration, ChartOptions} from "chart.js/dist/types";
import {updateLine} from "../../common/charts/utils";
import {ChartComponent} from "../../common/directives/chart.directive";
import {ChartAction} from "../../common/types/actions";


@Component({
  selector: 'app-curve-chart',
  templateUrl: './curve-chart.component.html',
  styleUrls: ['./curve-chart.component.css']
})
export class CurveChartComponent implements OnInit, AfterViewInit, ChartComponent{
  chartUpdateObs$: EventEmitter<ChartAction[]>;
  constructor(args: Injector) {
    this.chartUpdateObs$ = args.get('chartUpdateObs$');
    this.chartUpdateObs$.subscribe((actions: ChartAction[]) => {
      for (let action of actions){
        if (action.action == "flipY"){
          this.setYAxisReverse(action.payload);
        } else if (action.action == "setTitle"){
          this.setTitle(action.payload);
        } else if (action.action == "setXAxis"){
          this.setXAxis(action.payload);
        } else if (action.action == "setYAxis"){
          this.setYAxis(action.payload);
        }  else if (action.action.includes("setData")){
          this.setDataLabel(action.action, action.payload);
        } else if (action.action == 'showDataSet') {
          this.showDataSet(action.payload);
        } else if (action.action == 'hideDataSet') {
          this.hideDataSet(action.payload);
        }
      }
      this.lineChart.update('none');
    });
  }

  lineChart!: Chart;

  lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        label: 'y1',
        data: [],
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        hidden: false,
      }, {
        label: 'y2',
        data: [],
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        hidden: true,
      }, {
        label: 'y3',
        data: [],
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        hidden: true,
      }, {
        label: 'y4',
        data: [],
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        hidden: true,
      }
    ]
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    hover: {mode: 'nearest'},
    scales: {
      x: {
        title: {text: 'x', display: true},
        type: 'linear',
        position: 'bottom',
      },
      y: {
        title: {text: 'y', display: true},
        reverse: false,
      }
    },
    plugins: {
      title: {
        text: 'Title',
        display: true,
      }
    }
  };

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.lineChart = Chart.getChart("chart") as Chart;
    updateLine([{x:1, y1:2}, {x:2, y1:3}, {x:3, y1:4}], this.lineChart, 0, 'x', 'y1');
  }

  setYAxisReverse(isReversed: boolean): void{
    if (this.lineChart.options.scales && this.lineChart.options.scales['y']){
      this.lineChart.options.scales['y'].reverse = isReversed;
    }
  }

  setTitle(title: string): void{
    if (this.lineChart.options.plugins && this.lineChart.options.plugins.title){
      this.lineChart.options.plugins.title.text = title;
    }
  }

  setXAxis(title: string): void{
    if (this.lineChart.options.scales && this.lineChart.options.scales['x']){
      (this.lineChart.options.scales['x'] as LinearScaleOptions).title.text = title;
    }
  }

  setYAxis(title: string): void{
    if (this.lineChart.options.scales && this.lineChart.options.scales['y']){
      (this.lineChart.options.scales['y'] as LinearScaleOptions).title.text = title;
    }
  }

  setDataLabel(data: string, title: string): void{
    let tag: number = parseInt(data.charAt(data.length-1))-1;
    // if (!this.lineChart.data.datasets[tag].hidden){
    this.lineChart.data.datasets[tag].label = title;
    // }
  }

  hideDataSet(index: number|number[]): void{
    let indices = (typeof index == 'number')? [index]: index;
    for (let i of indices) {
      this.lineChart.data.datasets[i].hidden = true;
    }
  }

  showDataSet(index: number|number[]): void{
    let indices = (typeof index == 'number')? [index]: index;
    for (let i of indices) {
      this.lineChart.data.datasets[i].hidden = false;
    }
  }

}
