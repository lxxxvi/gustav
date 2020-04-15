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
                ncumulConf
                ndeltaConf
                ncumulHosp
                ndeltaHosp
                ncumulIcu
                ndeltaIcu
                ncumulVent
                ndeltaVent
                ncumulReleased
                ndeltaReleased
                ncumulDeceased
                ndeltaDeceased
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
    let allDeltaConf = covidCases.map((obj) => obj.ndeltaConf);
    let deltaConfMax = Math.max(...allDeltaConf);

    let allDeltaHosp = covidCases.map((obj) => obj.ndeltaHosp);
    let deltaHospMax =  Math.max(...allDeltaHosp);

    let allDeltaIcu = covidCases.map((obj) => obj.ndeltaIcu);
    let deltaIcuMax =  Math.max(...allDeltaIcu);

    let allDeltaVent = covidCases.map((obj) => obj.ndeltaVent);
    let deltaVentMax =  Math.max(...allDeltaVent);

    let allDeltaReleased = covidCases.map((obj) => obj.ndeltaReleased);
    let deltaReleasedMax =  Math.max(...allDeltaReleased);

    let allDeltaDeceased = covidCases.map((obj) => obj.ndeltaDeceased);
    let deltaDeceasedMax =  Math.max(...allDeltaDeceased);

    this.data.set('ndeltaconfMax', deltaConfMax);
    this.data.set('ndeltahospMax', deltaHospMax);
    this.data.set('ndeltaicuMax', deltaIcuMax);
    this.data.set('ndeltaventMax', deltaVentMax);
    this.data.set('ndeltareleasedMax', deltaReleasedMax);
    this.data.set('ndeltadeceasedMax', deltaDeceasedMax);
  }

  buildTableHeader() {
    let tr = "<tr>__ths__</tr>";

    let ths = `<th width="10px"></th>`; // first empty column

    const dateMin = moment(this.data.get('dateMin'));
    const dateMax = moment(this.data.get('dateMax'));

    let currentDate = dateMin;

    while(currentDate <= dateMax) {
      ths += `<th width="10px">${currentDate.format("DD/MM")}</th>`;
      currentDate = currentDate.add(1, 'day');
    }

    tr = tr.replace("__ths__", ths)
    this.tableHeaderTarget.innerHTML = tr;
  }

  buildTableBody(covidCases) {
    let byCantonAndDate = this.groupByCantonAndDate(covidCases);
    const dateMax = moment(this.data.get('dateMax'));

    let trs = [];
    let _this = this;

    console.log('this.data', this.data);

    const sampleTargets = [
      'ndeltaConf', 'ndeltaHosp', 'ndeltaIcu', 'ndeltaVent', 'ndeltaReleased', 'ndeltaDeceased'
    ];

    Array.from(sampleTargets).forEach(function(sampleTarget) {
      Object.entries(byCantonAndDate).forEach(function([canton, dates]) {
        let tds = [`<td>${canton}</td>`];

        let currentDate = moment(_this.data.get('dateMin'));

        while(currentDate <= dateMax) {
          let key = currentDate.format("YYYY-MM-DD");
          let date = dates[key];
          let value = '';
          if(date !== undefined && Number.parseInt(date[sampleTarget]) >= 0) {
             value = date[sampleTarget];
          }

          let opacity = _this.getOpacity(value, _this.data.get(`${sampleTarget.toLowerCase()}Max`));
          tds.push(`<td class="matrix" style="opacity: ${opacity}%;" title="${value}">${value}</td>`);

          currentDate = currentDate.add(1, 'day');
        }

        let tr = `<tr class="hidden ${sampleTarget}">${tds.join("")}</tr>`;
        trs.push(tr)
      });
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

  getOpacity(value, max) {
    if(Number.parseInt(value) > 0) {
      let percentage = value / max * 100;
      return Math.ceil(percentage / 10) * 10;
    } else {
      return 0;
    }
  }
}
