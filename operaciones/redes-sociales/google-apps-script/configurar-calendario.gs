function configurarCalendarioContarae() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Calendario";
  const existing = ss.getSheetByName(sheetName);
  const sheet = existing || ss.insertSheet(sheetName);

  const headers = [
    "id",
    "fecha_creacion",
    "fecha_programada",
    "hora_programada",
    "tipo_contenido",
    "fuente",
    "tema",
    "plataformas",
    "formato",
    "estado",
    "titulo",
    "copy_facebook",
    "copy_instagram",
    "copy_tiktok",
    "guion_video",
    "texto_carrusel",
    "hashtags",
    "asset_url",
    "pdf_url",
    "fuente_legal",
    "requiere_revision_tributaria",
    "aprobado_por",
    "fecha_aprobacion",
    "facebook_post_id",
    "instagram_post_id",
    "tiktok_estado",
    "error",
    "notas"
  ];

  sheet.clear();
  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#0f172a")
    .setFontColor("#ffffff");

  sheet.getRange(2, 1, 500, headers.length).setWrap(true);
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(7, 260);
  sheet.setColumnWidth(11, 260);
  sheet.setColumnWidth(12, 360);
  sheet.setColumnWidth(13, 360);
  sheet.setColumnWidth(14, 320);
  sheet.setColumnWidth(15, 360);
  sheet.setColumnWidth(16, 360);
  sheet.setColumnWidth(28, 320);

  const estadoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["idea", "borrador", "pendiente_aprobacion", "aprobado", "publicado", "error", "descartado"], true)
    .setAllowInvalid(false)
    .build();

  const tipoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["organico", "pdf"], true)
    .setAllowInvalid(false)
    .build();

  const formatoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["post", "carrusel", "reel", "video_corto"], true)
    .setAllowInvalid(false)
    .build();

  const revisionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["si", "no"], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange("E2:E501").setDataValidation(tipoRule);
  sheet.getRange("I2:I501").setDataValidation(formatoRule);
  sheet.getRange("J2:J501").setDataValidation(estadoRule);
  sheet.getRange("U2:U501").setDataValidation(revisionRule);

  const sampleRows = [
    [
      "CON-0001",
      new Date(),
      "",
      "09:00",
      "organico",
      "idea_ia",
      "5 errores que se cometen en la declaracion de renta",
      "facebook,instagram,tiktok",
      "carrusel",
      "idea",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "si",
      "",
      "",
      "",
      "",
      "",
      "",
      "Publicacion educativa para personas naturales."
    ],
    [
      "CON-0002",
      new Date(),
      "",
      "10:30",
      "pdf",
      "google_drive_pdf",
      "Resumen de nuevo documento tributario",
      "facebook,instagram,tiktok",
      "reel",
      "idea",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "si",
      "",
      "",
      "",
      "",
      "",
      "",
      "Se completa automaticamente cuando se cargue PDF."
    ]
  ];

  sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);

  const range = sheet.getRange(2, 1, 500, headers.length);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("aprobado")
      .setBackground("#dcfce7")
      .setRanges([sheet.getRange("J2:J501")])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("error")
      .setBackground("#fee2e2")
      .setRanges([sheet.getRange("J2:J501")])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("pendiente_aprobacion")
      .setBackground("#fef9c3")
      .setRanges([sheet.getRange("J2:J501")])
      .build()
  ];

  sheet.setConditionalFormatRules(rules);
  sheet.autoResizeColumns(1, headers.length);
  range.createFilter();
}
