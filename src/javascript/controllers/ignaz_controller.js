import { Controller } from "stimulus";
var moment = require('moment');

export default class extends Controller {
  static targets = ["loading", "tableHeader", "tableBody"]

  connect() {
    this.fetchData();
  }

  fetchData() {
    console.log('fetchData');
    let query = `query {
              covidCases {
                date
                time
                abbreviationCantonAndFl
                testedTotal
                testedTotalDelta
                confirmedTotal
                confirmedTotalDelta
                hospitalizedCurrent
                hospitalizedCurrentDelta
                icuCurrent
                icuCurrentDelta
                ventilationCurrent
                ventilationCurrentDelta
                releasedTotal
                releasedTotalDelta
                deceasedTotal
                deceasedTotalDelta
              }
            }`

    fetch(this.data.get("graphqlEndpoint"), {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({query})
    })
      .then(response => response.json())
      .then(json => this.renderChart(json.data.covidCases));
  }

  renderChart(covidCases) {
    console.log('covidCases: ', covidCases);
    this.loadingTarget.classList.add('hidden');
    this.findDateRange(covidCases);
    this.findMaximumDeltas(covidCases);
    this.buildTableHeader();
    this.buildTableBody(covidCases);
    this.display(this.data.get('currentlyShown'));
  }

  handleDisplayButtonClick(event) {
    let clickedButton = event.target;
    this.display(clickedButton.dataset.displaySampleTarget);
  }

  display(sampleTarget) {
    Array.from(this.tableBodyTarget.querySelectorAll('tr')).forEach(function(element) {
      element.classList.add('hidden');
    });

    Array.from(this.tableBodyTarget.querySelectorAll(`tr.${sampleTarget}`)).forEach(function(element) {
      element.classList.remove('hidden');
    });

    this.data.set('currentlyShown', sampleTarget);
  }

  findDateRange(covidCases) {
    let allDateNumbers = covidCases.map(function(obj) {
      let date = obj.date;
      let time = obj.time === undefined ? "00:00" : obj.time;

      return moment(`${date} ${time}`, "YYYY-MM-DD h:mm");
    });

    let dateMin = new Date(Math.min(...allDateNumbers));
    let dateMax = new Date(Math.max(...allDateNumbers));

    this.data.set('dateMin', moment(dateMin).format());
    this.data.set('dateMax', moment(dateMax).format());
  }

  findMaximumDeltas(covidCases) {
    let allDeltaTested = covidCases.map((obj) => obj.testedTotalDelta);
    let deltaTestedMax = Math.max(...allDeltaTested);

    let allDeltaConf = covidCases.map((obj) => obj.confirmedTotalDelta);
    let deltaConfMax = Math.max(...allDeltaConf);

    let allDeltaHosp = covidCases.map((obj) => obj.hospitalizedCurrentDelta);
    let deltaHospMax =  Math.max(...allDeltaHosp);

    let allDeltaIcu = covidCases.map((obj) => obj.icuCurrentDelta);
    let deltaIcuMax =  Math.max(...allDeltaIcu);

    let allDeltaVent = covidCases.map((obj) => obj.ventilationCurrentDelta);
    let deltaVentMax =  Math.max(...allDeltaVent);

    let allDeltaReleased = covidCases.map((obj) => obj.releasedTotalDelta);
    let deltaReleasedMax =  Math.max(...allDeltaReleased);

    let allDeltaDeceased = covidCases.map((obj) => obj.deceasedTotalDelta);
    let deltaDeceasedMax =  Math.max(...allDeltaDeceased);

    this.data.set('testedTotalDeltaMax', deltaTestedMax);
    this.data.set('confirmedTotalDeltaMax', deltaConfMax);
    this.data.set('hospitalizedCurrentDeltaMax', deltaHospMax);
    this.data.set('icuCurrentDeltaMax', deltaIcuMax);
    this.data.set('ventilationCurrentDeltaMax', deltaVentMax);
    this.data.set('releasedTotalDeltaMax', deltaReleasedMax);
    this.data.set('deceasedTotalDeltaMax', deltaDeceasedMax);
  }

  buildTableHeader() {
    let trs = [];

    const dateMax = moment(this.data.get('dateMax'));

    // months
    var ths = ["<th></th>"]; // first empty column

    var currentDate =  moment(this.data.get('dateMin'));
    let prevDay = currentDate.clone();
    let colspan = 0;

    while(currentDate <= dateMax) {
      if (prevDay.format("MM") != currentDate.format("MM")) {
        ths.push(`<th colspan="${colspan}" style="text-align: left;">${prevDay.format("MMM")}</th>`);
        colspan = 1;
      } else {
        colspan += 1;
      }

      prevDay = currentDate.clone();
      currentDate = currentDate.add(1, 'day');
    }

    ths.push(`<th colspan="${colspan}" style="text-align: left;">${prevDay.format("MMM")}</th>`);

    trs.push(`<tr>${ths.join("")}</tr>`);
    this.tableHeaderTarget.innerHTML = trs.join("");


    // dates column
    var ths = ["<th></th>"]; // first empty column

    var currentDate = moment(this.data.get('dateMin'));

    while(currentDate <= dateMax) {
      ths.push(`<th width="32px">${currentDate.format("DD")}</th>`);
      currentDate = currentDate.add(1, 'day');
    }

    trs.push(`<tr>${ths.join("")}</tr>`);
    this.tableHeaderTarget.innerHTML = trs.join("");
  }

  buildTableBody(covidCases) {
    let byCantonAndDate = this.groupByCantonAndDate(covidCases);
    const dateMax = moment(this.data.get('dateMax'));

    let trs = [];
    let _this = this;

    console.log('this.data', this.data);

    const sampleTargets = [
      'testedTotalDelta', 'confirmedTotalDelta', 'hospitalizedCurrentDelta', 'icuCurrentDelta',
      'ventilationCurrentDelta', 'releasedTotalDelta', 'deceasedTotalDelta'
    ];

    Array.from(sampleTargets).forEach(function(sampleTarget) {
      let sampleTargetTotals = {};

      Object.entries(byCantonAndDate).forEach(function([canton, dates]) {
        let tds = [`<td>${canton}</td>`];

        let currentDate = moment(_this.data.get('dateMin'));

        while(currentDate <= dateMax) {
          let key = currentDate.format("YYYY-MM-DD");
          let date = dates[key];
          let value = "&nbsp;";
          if(date !== undefined) {
             value = date[sampleTarget];
             sampleTargetTotals[key] = (sampleTargetTotals[key] || 0) + value;
          }

          let opacityClass = _this.getOpacityClass(value, _this.data.get(`${sampleTarget}Max`));
          tds.push(`<td class="matrix ${opacityClass}" title="${value}">${value}</td>`);

          currentDate = currentDate.add(1, 'day');
        }

        let tr = `<tr class="hidden ${sampleTarget}">${tds.join("")}</tr>`;
        trs.push(tr)
      });

      // TOTALS
      let tds = [`<td>Total</td>`];

      let currentDate = moment(_this.data.get('dateMin'));

      while(currentDate <= dateMax) {
        let key = currentDate.format("YYYY-MM-DD");
        let value = sampleTargetTotals[key];

        let opacityClass = _this.getOpacityClass(value, _this.data.get(`${sampleTarget}Max`));
        tds.push(`<td class="matrix ${opacityClass}" title="${value}">${value}</td>`);
        currentDate = currentDate.add(1, 'day');
      }

      let tr = `<tr class="hidden ${sampleTarget} total">${tds.join("")}</tr>`;
      trs.push(tr);
    });

    this.tableBodyTarget.innerHTML = trs.join("");
  }

  groupByCantonAndDate(covidCases) {
    let byCanton = {};
    covidCases.map(function(obj) {
      if (byCanton[obj.abbreviationCantonAndFl] === undefined) {
        byCanton[obj.abbreviationCantonAndFl] = [obj];
      } else {
        byCanton[obj.abbreviationCantonAndFl].push(obj);
      }
    });

    let byCantonAndDate = {}
    Object.entries(byCanton).forEach(function([canton, samples]) {
      let samplesByDate = samples.reduce(function(acc, cur) {
        acc[cur.date] = cur;
        return acc;
      }, {});
      byCantonAndDate[canton] = samplesByDate
    });

    return byCantonAndDate;
  }

  getOpacityClass(value, max) {
    let parsedValue = Number.parseInt(value);

    if(parsedValue > 0) {
      let percentage = value / max * 100;
      return `opacity-${Math.ceil(percentage / 10) * 10}`;
    } else if (parsedValue < 0) {
      return 'bg-pale-green text-green opacity-50';
    } else {
      return "bg-white text-white";
    }
  }
}
