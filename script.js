let rows = [
  { load: '100', indicated: '100.1', mpe: '0.3' },
  { load: '250', indicated: '249.8', mpe: '0.5' },
  { load: '500', indicated: '500.4', mpe: '0.8' }
];

function fld(id) {
  return document.getElementById(id).value.trim();
}

function renderRows() {
  const body = document.getElementById('readings-body');
  body.innerHTML = '';

  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="num-input" data-i="${i}" data-f="load" value="${r.load}" placeholder="kg"></td>
      <td><input class="num-input" data-i="${i}" data-f="indicated" value="${r.indicated}" placeholder="kg"></td>
      <td><input class="num-input" data-i="${i}" data-f="mpe" value="${r.mpe}" placeholder="kg"></td>
      <td class="row-result ${rowResult(r).cls}">${rowResult(r).label}</td>
      <td><button class="rm-btn" data-rm="${i}" title="Remove">&times;</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const i = +e.target.dataset.i;
      const f = e.target.dataset.f;
      rows[i][f] = e.target.value;
      renderRows();
      renderCertificate();
    });
  });

  body.querySelectorAll('[data-rm]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      rows.splice(+e.target.dataset.rm, 1);
      renderRows();
      renderCertificate();
    });
  });
}

function rowResult(r) {
  const load = parseFloat(r.load);
  const ind = parseFloat(r.indicated);
  const mpe = parseFloat(r.mpe);

  if (isNaN(load) || isNaN(ind) || isNaN(mpe)) {
    return { label: '—', cls: '', pass: null, error: null };
  }

  const error = ind - load;
  const pass = Math.abs(error) <= mpe;
  return { label: pass ? 'PASS' : 'FAIL', cls: pass ? 'pass' : 'fail', pass, error };
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function certNumber() {
  if (!window._certNo) {
    const d = new Date();
    window._certNo = 'NAWI-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
  }
  return window._certNo;
}

function renderCertificate() {
  const make = fld('f-make') || '—';
  const model = fld('f-model') || '—';
  const serial = fld('f-serial') || '—';
  const cls = document.getElementById('f-class').value;
  const max = fld('f-max') || '—';
  const min = fld('f-min') || '—';
  const e = fld('f-e') || '—';
  const location = fld('f-location') || '—';
  const date = document.getElementById('f-date').value || todayStr();
  const operator = fld('f-operator') || '—';

  const validRows = rows.filter((r) => r.load !== '' && r.indicated !== '' && r.mpe !== '');
  const results = validRows.map(rowResult);
  const overallPass = results.length > 0 && results.every((r) => r.pass);
  const anyEvaluated = results.length > 0;

  let tableRows = '';
  validRows.forEach((r, i) => {
    const res = results[i];
    const errStr = res.error === null ? '—' : (res.error >= 0 ? '+' : '') + res.error.toFixed(2);
    tableRows += `
      <tr>
        <td>${r.load}</td>
        <td>${r.indicated}</td>
        <td>${errStr}</td>
        <td>±${r.mpe}</td>
        <td class="res ${res.cls}">${res.label}</td>
      </tr>`;
  });

  const bodyHtml = validRows.length === 0
    ? '<div class="empty-note">Add test points to generate the report.</div>'
    : `
      <div class="cert-block">
        <h3>TEST READINGS</h3>
        <table class="cert-table">
          <thead>
            <tr><th>Test load</th><th>Indicated</th><th>Error</th><th>MPE</th><th>Result</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>

      <div class="verdict">
        <div>
          <div class="label">OVERALL COMPLIANCE</div>
          <div style="font-size:11.5px;color:var(--ink-soft);margin-top:2px;">${results.length} test point${results.length === 1 ? '' : 's'} evaluated against declared class ${cls}</div>
        </div>
        <div class="stamp ${overallPass ? 'pass' : 'fail'}">${overallPass ? 'CONFORMS' : 'NON-CONFORM'}</div>
      </div>`;

  const html = `
    <div class="cert-head">
      <div>
        <h2>Weighing Instrument Test Report</h2>
        <div class="sub">Non-Automatic Weighing Instrument (NAWI) — legal metrology verification</div>
      </div>
      <div class="cert-no">
        <div>CERTIFICATE NO.</div>
        <div class="val">${certNumber()}</div>
      </div>
    </div>

    <div class="cert-block">
      <h3>INSTRUMENT UNDER TEST</h3>
      <div class="kv-grid">
        <div class="kv"><span class="k">Make</span><span class="v">${make}</span></div>
        <div class="kv"><span class="k">Model</span><span class="v">${model}</span></div>
        <div class="kv"><span class="k">Serial no.</span><span class="v">${serial}</span></div>
        <div class="kv"><span class="k">Accuracy class</span><span class="v">${cls}</span></div>
        <div class="kv"><span class="k">Max capacity</span><span class="v">${max}</span></div>
        <div class="kv"><span class="k">Min capacity</span><span class="v">${min}</span></div>
        <div class="kv"><span class="k">Scale interval (e)</span><span class="v">${e}</span></div>
        <div class="kv"><span class="k">Test location</span><span class="v">${location}</span></div>
      </div>
    </div>

    ${bodyHtml}

    <div class="cert-foot">
      <div>
        Test date: <span class="num">${date}</span><br>
        Operator: ${operator}
        <div class="sig-line">Authorised signatory</div>
      </div>
      <div style="text-align:right;">
        Report generated: <span class="num">${new Date().toLocaleString()}</span><br>
        Status: ${anyEvaluated ? (overallPass ? 'Compliant' : 'Non-compliant') : 'Pending data'}
      </div>
    </div>
  `;

  document.getElementById('certificate').innerHTML = html;
  document.getElementById('certificate-print').innerHTML = html;
}

document.getElementById('add-row').addEventListener('click', () => {
  rows.push({ load: '', indicated: '', mpe: '' });
  renderRows();
  renderCertificate();
});

document.getElementById('print-btn').addEventListener('click', () => {
  document.body.classList.add('printing');

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 250);
  }, 50);
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing');
});

document.querySelectorAll('.form-panel input, .form-panel select').forEach((el) => {
  el.addEventListener('input', renderCertificate);
  el.addEventListener('change', renderCertificate);
});

renderRows();
renderCertificate();
