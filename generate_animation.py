import csv
import json

data = []
with open('/Users/ericamador/antigravity/pqc-timeline-app/src/data/algorithms_transitions_02162026.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        data.append({
            "classical": f"{row['Classical Algorithm']} ({row['Key Size']})",
            "pqc": row['PQC Replacement'],
            "function": row['Function'],
            "deprecation": row['Deprecation Date'],
            "standardization": row['Standardization Date']
        })

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PQC Transitions Animation</title>
<style>
  body {
    background-color: #0f172a;
    color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 40px;
    overflow: hidden;
  }
  h1 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 40px;
    background: linear-gradient(90deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    opacity: 0;
    animation: fadeIn 1s forwards;
  }
  .container {
    display: flex;
    flex-direction: column;
    gap: 30px;
    max-width: 1000px;
    margin: 0 auto;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1e293b;
    padding: 15px 30px;
    border-radius: 12px;
    opacity: 0;
    transform: translateY(20px);
    border: 1px solid #334155;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
  .classical {
    flex: 1;
    font-size: 1.2rem;
    font-weight: 500;
    color: #f1f5f9;
  }
  .arrow-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  .function-label {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .arrow {
    width: 0;
    height: 4px;
    background: linear-gradient(90deg, #ef4444, #22c55e);
    position: relative;
    border-radius: 2px;
    transition: width 1s ease-in-out;
  }
  .arrow::after {
    content: '';
    position: absolute;
    right: -2px;
    top: -4px;
    border-left: 8px solid #22c55e;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  .arrow.animate {
    width: 150px;
  }
  .arrow.animate::after {
    opacity: 1;
    transition-delay: 1s;
  }
  .pqc {
    flex: 1;
    text-align: right;
    font-size: 1.2rem;
    font-weight: bold;
    color: #22c55e;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.5s ease-out;
  }
  .pqc.animate {
    opacity: 1;
    transform: translateX(0);
  }
  .metadata {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 5px;
    font-weight: normal;
  }
  
  @keyframes fadeIn {
    to { opacity: 1; }
  }
</style>
</head>
<body>
  <h1>Algorithm Transitions to Post-Quantum Cryptography</h1>
  <div class="container" id="container"></div>

  <script>
    const data = """ + json.dumps(data) + """;
    
    // We have a lot of rows (35), so we might want to just show a representative subset 
    // or scroll through them. For an animation, let's pick 8 key transitions to fit the screen.
    const subset = [
      data[0], // RSA 2048 -> ML-KEM-512
      data[7], // X25519 -> ML-KEM-768
      data[10], // RSA 2048 -> HQC-128
      data[17], // X25519 -> X25519MLKEM768 (Wait, index 17)
      data[20], // RSA-PSS 2048 -> ML-DSA-44
      data[22], // ECDSA P-256 -> ML-DSA-44
      data[27], // ECDSA P-256 -> FN-DSA-512
      data[34], // Any -> SLH-DSA
    ].filter(Boolean); // safety check

    const container = document.getElementById('container');
    
    subset.forEach((row, i) => {
      const div = document.createElement('div');
      div.className = 'row';
      div.innerHTML = `
        <div class="classical">
          ${row.classical}
          <div class="metadata">Deprecates: ${row.deprecation}</div>
        </div>
        <div class="arrow-container">
          <div class="function-label">${row.function}</div>
          <div class="arrow"></div>
        </div>
        <div class="pqc">
          ${row.pqc}
          <div class="metadata">Standardized: ${row.standardization}</div>
        </div>
      `;
      container.appendChild(div);
      
      // Animate sequentially
      setTimeout(() => {
        div.style.transition = 'opacity 0.5s, transform 0.5s';
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
        
        setTimeout(() => {
          div.querySelector('.arrow').classList.add('animate');
          
          setTimeout(() => {
            div.querySelector('.pqc').classList.add('animate');
          }, 800);
        }, 300);
        
      }, 500 + (i * 800));
    });
  </script>
</body>
</html>
"""

with open('/Users/ericamador/antigravity/pqc-timeline-app/animation.html', 'w') as f:
    f.write(html)
