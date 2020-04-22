export default class GustavConfig {
  static sampleTargets = [
            {
              columnName: 'testedTotalDelta',
              name: 'Tested',
              primaryColor: 'pink'
            },
            {
              columnName: 'confirmedTotalDelta',
              name: 'Confirmed',
              primaryColor: 'indigo'
            },
            {
              columnName: 'hospitalizedCurrentDelta',
              name: 'Hospitalized',
              primaryColor: 'purple'
            },
            {
              columnName: 'icuCurrentDelta',
              name: 'ICU',
              primaryColor: 'orange'
            },
            {
              columnName: 'ventilationCurrentDelta',
              name: 'Ventilation',
              primaryColor: 'red'
            },
            {
              columnName: 'releasedTotalDelta',
              name: 'Released',
              primaryColor: 'green'
            },
            {
              columnName: 'deceasedTotalDelta',
              name: 'Deceased',
              primaryColor: 'gray'
            }
          ];

  constructor() {}

  get sampleTargets() {
    return GustavConfig.sampleTargets;
  }

  get sampleTargetColumnNames() {
    return GustavConfig.sampleTargets.map(e => e.columnName);
  }

  findByColumnName(columnName) {
    return GustavConfig.sampleTargets.find(e => e.columnName == columnName);
  }
};
