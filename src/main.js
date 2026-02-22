import './style.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkuzUNBpO4_T3A5Ng1IvRU6s0xfoFXBRw",
  authDomain: "postalapp-6df27.firebaseapp.com",
  projectId: "postalapp-6df27",
  storageBucket: "postalapp-6df27.firebasestorage.app",
  messagingSenderId: "575011512886",
  appId: "1:575011512886:web:aabbb22c048f4171bfee97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.querySelector('#app').innerHTML = `
  <div class="controls-panel">
    <h1>Crear Postal</h1>
    
    <div class="control-group">
      <label for="imageUpload">Foto Frontal</label>
      <input type="file" id="imageUpload" accept="image/*" />
    </div>

    <div class="control-group">
      <label for="photoLocation">Lugar de la Foto</label>
      <input type="text" id="photoLocation" placeholder="Ej: Buenos Aires, Argentina" />
    </div>

    <div class="control-group">
      <label for="writeMode">Modo de Escritura (Dorso)</label>
      <select id="writeMode">
        <option value="typed">Escribir con teclado</option>
        <option value="handwritten">Líneas para escribir a mano</option>
      </select>
    </div>

    <div class="control-group">
      <label for="fontSelect">Fuente (Modo teclado)</label>
      <select id="fontSelect">
        <option value="'Caveat', cursive">Caveat</option>
        <option value="'Dancing Script', cursive">Dancing Script</option>
        <option value="'Pacifico', cursive">Pacifico</option>
        <option value="'Shadows Into Light', cursive">Shadows Into Light</option>
        <option value="'Inter', sans-serif">Inter</option>
      </select>
    </div>

    <div class="control-group">
      <label for="paperColor">Color de Papel (Dorso)</label>
      <input type="color" id="paperColor" value="#fffcf8" />
    </div>

    <div class="control-group">
      <label for="lineColor">Color de Líneas</label>
      <input type="color" id="lineColor" value="#cccccc" />
    </div>

    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <button id="savePdfBtn">Guardar como PDF (A5)</button>
      <button id="saveFirebaseBtn" class="secondary-btn">Guardar Postal en Firebase</button>
    </div>
  </div>

  <div class="preview-area">
    <div id="export-container">
      
      <!-- FRONT SIDE -->
      <div class="postcard front" id="cardFront">
        <div class="image-placeholder" id="imagePlaceholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          Sube una foto
        </div>
        <div class="photo-location-label" id="photoLocationLabel"></div>
      </div>

      <!-- BACK SIDE -->
      <div class="postcard back mode-typed" id="cardBack">
        <div class="left-side">
          <textarea class="text-area" id="messageText" placeholder="Escribe tu mensaje aquí..."></textarea>
          <div class="lines-overlay"></div>
        </div>
        
        <div class="divider"></div>
        
        <div class="right-side">
          <div class="stamp">Estampilla</div>
          <div class="address-container">
            <input type="text" class="address-line" id="addressName" placeholder="Nombre" />
            <input type="text" class="address-line" id="addressStreet" placeholder="Dirección" />
            <input type="text" class="address-line" id="addressCity" placeholder="Ciudad, Código Postal" />
          </div>
        </div>
      </div>

    </div>
  </div>
`;

// Elements
const imageUpload = document.getElementById('imageUpload');
const cardFront = document.getElementById('cardFront');
const imagePlaceholder = document.getElementById('imagePlaceholder');

const writeMode = document.getElementById('writeMode');
const cardBack = document.getElementById('cardBack');

const fontSelect = document.getElementById('fontSelect');
const messageText = document.getElementById('messageText');

const addressName = document.getElementById('addressName');
const addressStreet = document.getElementById('addressStreet');
const addressCity = document.getElementById('addressCity');

const paperColor = document.getElementById('paperColor');
const lineColor = document.getElementById('lineColor');
const root = document.documentElement;

const savePdfBtn = document.getElementById('savePdfBtn');

const photoLocation = document.getElementById('photoLocation');
const photoLocationLabel = document.getElementById('photoLocationLabel');

// Event Listeners

// 0. Photo Location overlay
photoLocation.addEventListener('input', (e) => {
  photoLocationLabel.textContent = e.target.value;
});

// 1. Image Upload
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      cardFront.style.backgroundImage = `url(${event.target.result})`;
      imagePlaceholder.style.display = 'none';
      cardFront.style.border = '15px solid white';
      cardFront.style.borderBottomWidth = '30px';
    };
    reader.readAsDataURL(file);
  }
});

// 2. Write Mode Toggle
writeMode.addEventListener('change', (e) => {
  if (e.target.value === 'handwritten') {
    cardBack.classList.remove('mode-typed');
    cardBack.classList.add('mode-handwritten');
  } else {
    cardBack.classList.remove('mode-handwritten');
    cardBack.classList.add('mode-typed');
  }
});

// 3. Font Selection
fontSelect.addEventListener('change', (e) => {
  messageText.style.fontFamily = e.target.value;
  addressName.style.fontFamily = e.target.value;
  addressStreet.style.fontFamily = e.target.value;
  addressCity.style.fontFamily = e.target.value;
});

// Initialize font to first option
messageText.style.fontFamily = fontSelect.value;
addressName.style.fontFamily = fontSelect.value;
addressStreet.style.fontFamily = fontSelect.value;
addressCity.style.fontFamily = fontSelect.value;

// 4. Color Pickers
paperColor.addEventListener('input', (e) => {
  root.style.setProperty('--card-bg', e.target.value);
});

lineColor.addEventListener('input', (e) => {
  root.style.setProperty('--line-color', e.target.value);
});

// 5. PDF Export
savePdfBtn.addEventListener('click', async () => {
  document.body.classList.add('pdf-export-mode');
  savePdfBtn.disabled = true;
  savePdfBtn.innerText = 'Generando PDF...';

  try {
    // Import jsPDF and html2canvas directly for per-page rendering
    const { jsPDF } = await import('jspdf');
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;

    const pdf = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'landscape' });
    const pdfWidth = 210;  // A5 landscape width in mm
    const pdfHeight = 148; // A5 landscape height in mm

    // Render FRONT side (page 1)
    const frontCanvas = await html2canvas(cardFront, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    });
    const frontImg = frontCanvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(frontImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Render BACK side (page 2)
    pdf.addPage('a5', 'landscape');
    const backCanvas = await html2canvas(cardBack, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      onclone: (clonedDoc, clonedElement) => {
        // html2canvas can't properly render <textarea> and <input> values.
        // Replace them with styled <div> elements containing the actual text.

        // Fix message textarea
        const clonedTextarea = clonedElement.querySelector('.text-area');
        if (clonedTextarea) {
          const div = clonedDoc.createElement('div');
          div.style.cssText = window.getComputedStyle(messageText).cssText;
          div.style.fontFamily = fontSelect.value;
          div.style.whiteSpace = 'pre-wrap';
          div.style.wordWrap = 'break-word';
          div.style.overflowWrap = 'break-word';
          div.style.overflow = 'visible';
          div.textContent = messageText.value;
          clonedTextarea.parentNode.replaceChild(div, clonedTextarea);
        }

        // Fix address input fields
        const addressFields = [
          { selector: '#addressName', source: addressName },
          { selector: '#addressStreet', source: addressStreet },
          { selector: '#addressCity', source: addressCity }
        ];
        addressFields.forEach(({ selector, source }) => {
          const clonedInput = clonedElement.querySelector(selector);
          if (clonedInput) {
            const div = clonedDoc.createElement('div');
            div.style.cssText = window.getComputedStyle(source).cssText;
            div.style.fontFamily = fontSelect.value;
            div.style.overflow = 'visible';
            div.style.borderBottom = '2px solid ' + getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();
            div.style.height = '2.5rem';
            div.style.lineHeight = '2.5rem';
            div.textContent = source.value || '';
            clonedInput.parentNode.replaceChild(div, clonedInput);
          }
        });
      }
    });
    const backImg = backCanvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(backImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    pdf.save('postal-personalizada.pdf');
  } catch (err) {
    console.error('Error generando PDF:', err);
    alert('Hubo un error al generar el PDF.');
  } finally {
    document.body.classList.remove('pdf-export-mode');
    savePdfBtn.disabled = false;
    savePdfBtn.innerText = 'Guardar como PDF (A5)';
  }
});

// 6. Firebase Save
const saveFirebaseBtn = document.getElementById('saveFirebaseBtn');
saveFirebaseBtn.addEventListener('click', async () => {
  try {
    saveFirebaseBtn.disabled = true;
    saveFirebaseBtn.innerText = 'Guardando...';

    const postalData = {
      writeMode: writeMode.value,
      font: fontSelect.value,
      paperColor: paperColor.value,
      lineColor: lineColor.value,
      message: messageText.value,
      addressName: addressName.value,
      addressStreet: addressStreet.value,
      addressCity: addressCity.value,
      createdAt: serverTimestamp()
    };

    // In a real app we would upload the image to Firebase Storage and get URL
    // For now we omit the image data from Firestore to avoid giant documents.

    await addDoc(collection(db, 'postcards'), postalData);

    alert('¡Postal guardada en Firebase exitosamente!');
  } catch (err) {
    console.error('Error guardando postal:', err);
    alert('Hubo un error al guardar.');
  } finally {
    saveFirebaseBtn.disabled = false;
    saveFirebaseBtn.innerText = 'Guardar Postal en Firebase';
  }
});
