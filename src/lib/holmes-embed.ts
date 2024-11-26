import { EmbedBuilder, Colors } from "discord.js";

interface FieldData {
  name: string;
  value: string;
  inline?: boolean;
}

export class HolmesEmbedBuilder extends EmbedBuilder {
  constructor(title: string) {
    super();

    this.setTitle(title);
    this.setColor(Colors.Orange);
    this.setTimestamp();
  }

  addField({name, value, inline = false}: FieldData) {
    this.addFields([
      {
        name,
        value,
        inline,
      }
    ])
  }
}

export class ErrorEmbedBuilder extends HolmesEmbedBuilder {
  constructor(title: string) {
    super(title);

    this.setColor(Colors.DarkRed);
  }

  addError(error: string, inline: boolean = false) {
    this.addField({ name: "Error", value: error, inline });
  }
}

export class WarningEmbedBuilder extends HolmesEmbedBuilder {
  constructor(title: string) {
    super(title);

    this.setColor(Colors.Orange);
  }
}

export class SuccessEmbedBuilder extends HolmesEmbedBuilder {
  constructor(title: string) {
    super(title);

    this.setColor(Colors.Green);
  }
}
