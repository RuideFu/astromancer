import {Component, OnDestroy} from '@angular/core';
import {TableAction} from "../../../shared/types/actions";
import {PulsarService} from "../../pulsar.service";
import {HonorCodePopupService} from "../../../shared/honor-code-popup/honor-code-popup.service";
import {HonorCodeChartService} from "../../../shared/honor-code-popup/honor-code-chart.service";
import {MyFileParser} from "../../../shared/data/FileParser/FileParser";
import {FileType} from "../../../shared/data/FileParser/FileParser.util";
import {Subject, takeUntil} from "rxjs";
import {errorMSE, PulsarDataDict} from "../../pulsar.service.util";
import {MatDialog} from "@angular/material/dialog";
import {
  PulsarLightCurveChartFormComponent
} from "../pulsar-light-curve-chart-form/pulsar-light-curve-chart-form.component";

@Component({
  selector: 'app-pulsar-light-curve',
  templateUrl: './pulsar-light-curve.component.html',
  styleUrls: ['./pulsar-light-curve.component.scss', '../../../shared/interface/tools.scss']
})
export class PulsarLightCurveComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private fileParser: MyFileParser = new MyFileParser(FileType.CSV,
    ["id", "mjd", "mag", "mag_error"],);

  constructor(private service: PulsarService,
              private honorCodeService: HonorCodePopupService,
              private chartService: HonorCodeChartService,
              public dialog: MatDialog) {
    this.fileParser.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (error: any) => {
        alert("error " + error);
      });
    this.fileParser.data$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (data: any) => {
        const sources = Array.from(new Set(data.map((d: any) => d.id)));
        console.log(sources);
        if (sources.length < 2) {
          alert("Error" + "Please upload at least two sources")
          return;
        }
        const result: PulsarDataDict[] = [];
        const src0data = data.filter((d: any) => d.id === sources[0])
          .map((d: any) => [parseFloat(d.mjd), parseFloat(d.mag), parseFloat(d.mag_error)])
          .filter((d: any) => !isNaN(d[0]) && !isNaN(d[1]) && !isNaN(d[2]))
          .sort((a: any, b: any) => a[0] - b[0]);
        const src1data = data.filter((d: any) => d.id === sources[1])
          .map((d: any) => [parseFloat(d.mjd), parseFloat(d.mag), parseFloat(d.mag_error)])
          .filter((d: any) => !isNaN(d[0]) && !isNaN(d[1]) && !isNaN(d[2]))
          .sort((a: any, b: any) => a[0] - b[0]);
        let left = 0;
        let right = 0;
        const mjdThreshold = 0.00000001;
        while (left < src0data.length && right < src1data.length) {
          if (Math.abs(src0data[left][0] - src1data[right][0]) < mjdThreshold) {
            result.push({
              jd: src0data[left][0] as number,
              source1: src0data[left][1] as number,
              source2: src1data[right][1] as number,
              error1: src0data[left][2] as number,
              error2: src1data[right][2] as number,
              errorMSE: null,
            });
            left++;
            right++;
          } else if (src0data[left][0] < src1data[right][0]) {
            result.push({
              jd: src0data[left][0] as number,
              source1: src0data[left][1] as number,
              source2: null,
              error1: src0data[left][2] as number,
              error2: null,
              errorMSE: null,
            });
            left++;
          } else {
            result.push({
              jd: src1data[right][0] as number,
              source1: null,
              source2: src1data[right][1] as number,
              error1: null,
              error2: src1data[right][2] as number,
              errorMSE: null
            });
            right++;
          }
        }
        while (left < src0data.length) {
          result.push({
            jd: src0data[left][0] as number,
            source1: src0data[left][1] as number,
            source2: null,
            error1: src0data[left][2] as number,
            error2: null,
            errorMSE: null
          });
          left++;
        }
        while (right < src1data.length) {
          result.push({
            jd: src1data[right][0] as number,
            source1: null,
            source2: src1data[right][1] as number,
            error1: null,
            error2: src1data[right][2] as number,
            errorMSE: null
          });
          right++;
        }
        this.service.setData(result);
      });
  }

  actionHandler(actions: TableAction[]) {
    actions.forEach((action) => {
      if (action.action === "addRow") {
        this.service.addRow(-1, 1);
      } else if (action.action === "saveGraph") {
        this.saveGraph();
      } else if (action.action === "resetData") {
        this.service.resetData();
      } else if (action.action === "editChartInfo") {
        const dialogRef =
          this.dialog.open(PulsarLightCurveChartFormComponent, {width: 'fit-content'});
        dialogRef.afterClosed().pipe().subscribe(result => {
          if (result === "saveGraph")
            this.saveGraph();
        });
      }
    })
  }

  uploadHandler($event: File) {
    this.fileParser.readFile($event, true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private saveGraph() {
    this.honorCodeService.honored().subscribe((name: string) => {
      this.chartService.saveImageHighChartOffline(this.service.getHighChartLightCurve(), "Pulsar Light Curve", name);
    })
  }
}
