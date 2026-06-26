/* ===========================================================================
   export-excel.js — Exportación a Excel con diseño, compartida por los módulos
   Genera un .xlsx con: hoja de resumen + hojas de detalle con encabezado azul
   corporativo y colores por estado. Usa ExcelJS (se carga por CDN).

   - El período se detecta automáticamente de las fechas que haya en las filas
     (campos tipo "29/05/2026"); si no hay fechas, usa la fecha de hoy.
   - Se agrega una hoja "Resumen" al inicio con los conteos por estado.
   - El nombre del archivo incluye el período detectado (ej: _mayo2026).
   =========================================================================== */
(function(global){
  var AZUL = 'FF284A78';
  var COLORES = {
    ok:   'FFE3F1EA',   // verde suave (conciliado)
    arca: 'FFF6EDDA',   // naranja suave (solo ARCA/ARBA)
    sub:  'FFF6E4E2',   // rojo suave (solo OneSoft)
    manual:'FFEAF1FB'   // azul suave (conciliado a mano)
  };
  var MONTO_KEYS = ['os','arca','arba','dif','onesoft','importe','imp_os','imp_arca','monto'];
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function esMonto(key){
    key=(key||'').toLowerCase();
    for(var i=0;i<MONTO_KEYS.length;i++){ if(key===MONTO_KEYS[i]) return true; }
    return false;
  }

  // Detecta el mes/año más frecuente mirando las fechas dd/mm/aaaa de las filas
  function detectarPeriodo(hojas){
    var cuenta={};
    (hojas||[]).forEach(function(h){
      (h.filas||[]).forEach(function(f){
        for(var k in f){
          if(!f.hasOwnProperty(k)) continue;
          var v=f[k];
          if(typeof v!=='string') continue;
          var m=v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
          if(m){
            var mes=parseInt(m[2],10);
            var anio=m[3].length===2?2000+parseInt(m[3],10):parseInt(m[3],10);
            if(mes>=1&&mes<=12){
              var key=anio+'-'+mes;
              cuenta[key]=(cuenta[key]||0)+1;
            }
          }
        }
      });
    });
    var mejor=null, max=0;
    for(var key in cuenta){ if(cuenta[key]>max){ max=cuenta[key]; mejor=key; } }
    if(!mejor) return null;
    var p=mejor.split('-');
    return { mes:parseInt(p[1],10), anio:parseInt(p[0],10) };
  }

  function periodoLabel(per){ return per ? (MESES[per.mes-1]+' '+per.anio) : null; }
  function periodoSlug(per){ return per ? (MESES[per.mes-1]+per.anio) : new Date().toISOString().slice(0,10); }

  function contarEstados(hojas){
    var c={ok:0,manual:0,arca:0,sub:0,otros:0,total:0};
    (hojas||[]).forEach(function(h){
      (h.filas||[]).forEach(function(f){
        c.total++;
        var st=f._st||'otros';
        if(c[st]!==undefined) c[st]++; else c.otros++;
      });
    });
    return c;
  }

  function agregarResumen(wb, cfg, per, conteo){
    var ws=wb.addWorksheet('Resumen');
    ws.columns=[{width:34},{width:18}];

    ws.mergeCells('A1:B1');
    var t=ws.getCell('A1');
    t.value='Resumen de la conciliación';
    t.font={bold:true,size:15,color:{argb:AZUL}};
    t.alignment={vertical:'middle'};
    ws.getRow(1).height=28;

    var sub=ws.getCell('A2');
    sub.value=per ? ('Período: '+periodoLabel(per)) : 'Período: (sin fecha detectada)';
    sub.font={size:11,color:{argb:'FF61708A'}};
    ws.mergeCells('A2:B2');

    var conciliados=conteo.ok+conteo.manual;
    var tasa=conteo.total?Math.round((conciliados/conteo.total)*100):0;
    var datos=[
      ['', ''],
      ['Conciliados', conciliados],
      ['  · automáticos', conteo.ok],
      ['  · a mano', conteo.manual],
      ['Solo en ARCA/ARBA', conteo.arca],
      ['Solo en OneSoft', conteo.sub],
      ['Total de registros', conteo.total],
      ['Tasa de conciliación', tasa+'%']
    ];
    datos.forEach(function(d){
      var row=ws.addRow(d);
      var rowNum=row.number;
      var label=ws.getCell('A'+rowNum), val=ws.getCell('B'+rowNum);
      if(d[0]==='Conciliados'||d[0]==='Total de registros'||d[0]==='Tasa de conciliación'){
        label.font={bold:true}; val.font={bold:true};
      } else {
        label.font={color:{argb:'FF61708A'}};
      }
      val.alignment={horizontal:'right'};
      if(d[0]==='Conciliados'){ label.fill=val.fill={type:'pattern',pattern:'solid',fgColor:{argb:COLORES.ok}}; }
      if(d[0]==='Solo en ARCA/ARBA'){ label.fill=val.fill={type:'pattern',pattern:'solid',fgColor:{argb:COLORES.arca}}; }
      if(d[0]==='Solo en OneSoft'){ label.fill=val.fill={type:'pattern',pattern:'solid',fgColor:{argb:COLORES.sub}}; }
    });
  }

  async function exportarExcel(cfg){
    if(typeof ExcelJS==='undefined'){ alert('No se pudo cargar el generador de Excel. Reintentá en un momento.'); return; }
    var wb=new ExcelJS.Workbook();
    wb.creator='Portal Contable';
    wb.created=new Date();

    var per=detectarPeriodo(cfg.hojas);
    var conteo=contarEstados(cfg.hojas);

    agregarResumen(wb, cfg, per, conteo);

    (cfg.hojas||[]).forEach(function(hoja){
      var ws=wb.addWorksheet(hoja.nombre||'Hoja', {views:[{state:'frozen', ySplit:1}]});
      ws.columns=(hoja.columnas||[]).map(function(c){ return {header:c.header, key:c.key, width:c.width||16}; });

      var head=ws.getRow(1);
      head.height=22;
      head.eachCell(function(cell){
        cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:AZUL}};
        cell.font={color:{argb:'FFFFFFFF'},bold:true,size:11};
        cell.alignment={vertical:'middle',horizontal:'left'};
        cell.border={bottom:{style:'thin',color:{argb:'FFD2DDEE'}}};
      });

      (hoja.filas||[]).forEach(function(f){
        var row=ws.addRow(f);
        var bg=COLORES[f._st];
        row.eachCell(function(cell, colNumber){
          if(bg) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}};
          cell.alignment={vertical:'middle'};
          cell.border={bottom:{style:'hair',color:{argb:'FFE1E7F0'}}};
          var colDef=ws.columns[colNumber-1];
          if(colDef && esMonto(colDef.key)){
            cell.numFmt='#,##0.00';
            cell.alignment={vertical:'middle',horizontal:'right'};
          }
        });
      });

      if(ws.columnCount>0 && ws.rowCount>1){
        ws.autoFilter={ from:{row:1,column:1}, to:{row:1,column:ws.columnCount} };
      }
    });

    var buf=await wb.xlsx.writeBuffer();
    var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var nombre=(cfg.nombreArchivo||'conciliacion')+'_'+periodoSlug(per)+'.xlsx';
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=nombre;
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
  }

  global.exportarExcel=exportarExcel;
})(window);
