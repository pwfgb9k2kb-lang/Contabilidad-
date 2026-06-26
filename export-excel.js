/* ===========================================================================
   export-excel.js — Exportación a Excel con diseño, compartida por los módulos
   Genera un .xlsx con encabezado azul corporativo y colores por estado.
   Usa ExcelJS (se carga por CDN en cada módulo).

   Uso:
     exportarExcel({
       nombreArchivo: 'conciliacion_ganancias',
       hojas: [
         {
           nombre: 'Retenciones',
           columnas: [ {header:'Estado', key:'estado', width:20}, ... ],
           filas: [ {estado:'Coincide', ..., _st:'ok'}, ... ]   // _st: ok|arca|sub
         },
         ...
       ]
     });
   Los campos numéricos detectados (montos) se formatean con separador de miles.
   =========================================================================== */
(function(global){
  var AZUL = 'FF284A78';        // encabezado
  var COLORES = {               // fondos por estado
    ok:   'FFE3F1EA',           // verde suave (conciliado)
    arca: 'FFF6EDDA',           // naranja suave (solo ARCA/ARBA)
    sub:  'FFF6E4E2',           // rojo suave (solo OneSoft)
    manual:'FFEAF1FB'           // azul suave (conciliado a mano)
  };
  // Claves de columnas que se tratan como monto (formato #,##0.00)
  var MONTO_KEYS = ['os','arca','arba','dif','onesoft','importe','imp_os','imp_arca','monto'];

  function esMonto(key){
    key=(key||'').toLowerCase();
    for(var i=0;i<MONTO_KEYS.length;i++){ if(key===MONTO_KEYS[i]) return true; }
    return false;
  }

  async function exportarExcel(cfg){
    if(typeof ExcelJS==='undefined'){ alert('No se pudo cargar el generador de Excel. Reintentá en un momento.'); return; }
    var wb=new ExcelJS.Workbook();
    wb.creator='Portal Contable';
    wb.created=new Date();

    (cfg.hojas||[]).forEach(function(hoja){
      var ws=wb.addWorksheet(hoja.nombre||'Hoja', {views:[{state:'frozen', ySplit:1}]});
      ws.columns=(hoja.columnas||[]).map(function(c){ return {header:c.header, key:c.key, width:c.width||16}; });

      // Encabezado azul
      var head=ws.getRow(1);
      head.height=22;
      head.eachCell(function(cell){
        cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:AZUL}};
        cell.font={color:{argb:'FFFFFFFF'},bold:true,size:11};
        cell.alignment={vertical:'middle',horizontal:'left'};
        cell.border={bottom:{style:'thin',color:{argb:'FFD2DDEE'}}};
      });

      // Filas con color por estado
      (hoja.filas||[]).forEach(function(f){
        var row=ws.addRow(f);
        var st=f._st;
        var bg=COLORES[st];
        row.eachCell(function(cell, colNumber){
          if(bg) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}};
          cell.alignment={vertical:'middle'};
          cell.border={bottom:{style:'hair',color:{argb:'FFE1E7F0'}}};
          // formato de monto según la key de la columna
          var colDef=ws.columns[colNumber-1];
          if(colDef && esMonto(colDef.key)){
            cell.numFmt='#,##0.00';
            cell.alignment={vertical:'middle',horizontal:'right'};
          }
        });
      });

      // Autofiltro sobre el encabezado
      if(ws.columnCount>0 && ws.rowCount>1){
        ws.autoFilter={ from:{row:1,column:1}, to:{row:1,column:ws.columnCount} };
      }
    });

    var buf=await wb.xlsx.writeBuffer();
    var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var nombre=(cfg.nombreArchivo||'conciliacion')+'_'+new Date().toISOString().slice(0,10)+'.xlsx';
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=nombre;
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
  }

  global.exportarExcel=exportarExcel;
})(window);
