export default class GustavStyler {
  constructor(gustavConfig, sampleTargetMaximums) {
    this.gustavConfig = gustavConfig;
    this.sampleTargetMaximums = sampleTargetMaximums;
  }

  setSampleTargetMaximums(sampleTargetMaximums) {
    this.sampleTargetMaximums = sampleTargetMaximums;
  }

  getCellClasses(value, sampleTargetColumnName) {
    let parsedValue = Number.parseInt(value);
    let max = this.sampleTargetMaximums[sampleTargetColumnName];

    if(parsedValue > 0) {
      let percentage = value / max * 100;
      let decile = Math.min(100, Math.ceil(percentage / 10) * 10);
      let cssClasses = [
        this.getColorClass(decile),
        this.getBackgroundColorClass(decile, sampleTargetColumnName)
      ];

      return cssClasses.join(" ");
    } else if (parsedValue < 0) {
      return 'bg-green-200 text-green-900';
    } else {
      return "bg-white text-gray-100";
    }
  }

  getBackgroundColorClass(decile, sampleTargetColumnName) {
    let sampleTargetConfig = this.gustavConfig.findByColumnName(sampleTargetColumnName);

    return `bg-gustav-${sampleTargetConfig.primaryColor}-${decile}`;
  }

  getColorClass(decile) {
    if(decile > 50) {
      return 'text-white';
    }
  }
}
