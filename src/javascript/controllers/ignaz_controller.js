import { Controller } from "stimulus";
var moment = require('moment');

export default class extends Controller {
  static targets = ["loading", "tableHeader", "tableBody"]

  connect() {
    this.fetchData();
  }

  fetchData() {
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

    if(this.storedIgnazData === null) {
      console.log('fetching from ignaz');
      fetch(this.data.get("graphqlEndpoint"), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({query})
      })
        .then(response => response.json())
        .then(json => {
          this.storeIgnazData(json.data.covidCases);
          this.renderChart(json.data.covidCases);
        });
    } else {
      console.log('taking from store');
      this.renderChart(this.storedIgnazData);
    }
  }

  storeIgnazData(covidCases) {
    window.sessionStorage.setItem("lastFetched", moment());
    window.sessionStorage.setItem("covidCases", JSON.stringify(covidCases));
  }

  get storedIgnazData() {
    let lastFetched = moment(window.sessionStorage.getItem("lastFetchted"));

    if (typeof(Storage) === "undefined" || lastFetched < moment().subtract(10, 'minutes')) {
      return null;
    }

    return JSON.parse(window.sessionStorage.getItem("covidCases"));
  }

  renderChart(covidCases) {
    console.log('covidCases: ', covidCases);
    this.loadingTarget.classList.add('hidden');
    this.setDateRange(covidCases);
    this.setMaximumDeltas(covidCases);
    this.buildTableHeader();
    this.buildTableBody(covidCases);
    this.display(this.data.get('currentlyShown'));
  }

  get sampleTargets() {
    return [
      'testedTotalDelta',
      'confirmedTotalDelta',
      'hospitalizedCurrentDelta',
      'icuCurrentDelta',
      'ventilationCurrentDelta',
      'releasedTotalDelta',
      'deceasedTotalDelta'
    ];
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

  get fromMoment() {
    return moment(this.data.get('dateMin'));
  }

  get toMoment() {
    return moment(this.data.get('dateMax'));
  }

  sampleTargetMaximum(sampleTarget) {
    return this.data.get(`${sampleTarget}Max`);
  }

  setDateRange(covidCases) {
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

  findMaximumForAttribute(objects, attribute) {
    return Math.max(...objects.map(obj => obj[attribute]));
  }

  setMaximumDeltas(covidCases) {
    this.sampleTargets.forEach((attribute) => {
      this.data.set(`${attribute}Max`, this.findMaximumForAttribute(covidCases, attribute));
    });
  }

  buildTableHeader() {
    let trs = [];
    trs.push(this.buildMonthHeaderRow());
    trs.push(this.buildDayHeaderRow());
    this.tableHeaderTarget.innerHTML = trs.join("");
  }

  buildMonthHeaderRow() {
    var ths = ["<th></th>"]; // first empty column

    let prevDay = this.fromMoment;
    let colspan = 0;

    this.dateRange.forEach((date) => {
      if (prevDay.format("MM") != date.format("MM")) {
        ths.push(`<th colspan="${colspan}" style="text-align: left;">${prevDay.format("MMM")}</th>`);
        colspan = 1;
      } else {
        colspan += 1;
      }

      prevDay = date.clone();
    });

    ths.push(`<th colspan="${colspan}" style="text-align: left;">${prevDay.format("MMM")}</th>`);

    return `<tr>${ths.join("")}</tr>`;
  }

  buildDayHeaderRow() {
    var ths = ["<th></th>"]; // first empty column
    this.dateRange.forEach((date) => {
      ths.push(`<th width="32px">${date.format("DD")}</th>`);
    });

    return `<tr>${ths.join("")}</tr>`;
  }

  get dateRange() {
    let dates = [];
    let currentDate =  this.fromMoment;

    while(currentDate <= this.toMoment) {
      dates.push(currentDate.clone());
      currentDate.add(1, 'day');
    }

    return dates;
  }

  buildTableBody(covidCases) {
    let byCantonAndDate = this.groupByCantonAndDate(covidCases);

    let trs = [];

    this.sampleTargets.forEach((sampleTarget) => {
      let sampleTargetTotals = {};

      Object.entries(byCantonAndDate).forEach(([canton, cantonDates]) => {
        let tds = [`<td>${canton}</td>`];

        this.dateRange.forEach((date) => {
          let key = date.format("YYYY-MM-DD");
          let sampleDate = cantonDates[key];
          let value = "&nbsp;";
          if(sampleDate !== undefined) {
             value = sampleDate[sampleTarget];
             sampleTargetTotals[key] = (sampleTargetTotals[key] || 0) + value;
          }

          let opacityClass = this.getOpacityClass(value, this.sampleTargetMaximum(sampleTarget));
          tds.push(`<td class="matrix ${opacityClass}" title="${value}">${value}</td>`);
        });

        let tr = `<tr class="hidden ${sampleTarget}">${tds.join("")}</tr>`;
        trs.push(tr)
      });

      // TOTALS
      let tds = [`<td>Total</td>`];

      this.dateRange.forEach((date) => {
        let key = date.format("YYYY-MM-DD");
        let value = sampleTargetTotals[key];

        let opacityClass = this.getOpacityClass(value, this.sampleTargetMaximum(sampleTarget));
        tds.push(`<td class="matrix ${opacityClass}" title="${value}">${value}</td>`);
      });

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
