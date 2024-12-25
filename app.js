// Configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DATABASE_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let nombreUsuario = '';
let seleccionDias = [];

// Función para mostrar el calendario
function verCalendario() {
  nombreUsuario = document.getElementById("nombre").value;

  if (nombreUsuario) {
    document.getElementById("formulario").style.display = 'none';
    document.getElementById("calendario").style.display = 'block';

    // Inicializa el calendario
    $('#calendar').fullCalendar({
      events: function(start, end, timezone, callback) {
        let events = [];
        let currentMonth = moment().format('YYYY-MM');
        
        // Obtiene los eventos del mes actual desde Firebase
        db.ref('turnos/' + currentMonth).once('value', (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            let data = childSnapshot.val();
            if (data) {
              events.push({
                title: `${data.nombre} - ${data.turnos.length} persona(s)`,
                start: data.fecha,
                allDay: true,
                color: data.turnos.length >= 5 ? 'red' : 'green',
                id: childSnapshot.key
              });
            }
          });
          callback(events);
        });
      },
      dayClick: function(date, jsEvent, view) {
        let selectedDate = date.format();
        if (seleccionDias.length < 4 && !seleccionDias.includes(selectedDate)) {
          seleccionDias.push(selectedDate);
          alert(`Has seleccionado ${date.format('YYYY-MM-DD')}`);
        } else if (seleccionDias.includes(selectedDate)) {
          alert(`Ya has seleccionado este día.`);
        } else {
          alert(`Puedes seleccionar solo 4 días.`);
        }
      }
    });
  } else {
    alert("Por favor ingresa tu nombre.");
  }
}

// Función para registrar los turnos en Firebase
function registrarTurnos() {
  if (seleccionDias.length !== 4) {
    alert("Debes seleccionar exactamente 4 días.");
    return;
  }

  let currentMonth = moment().format('YYYY-MM');
  let fechaTurnos = seleccionDias.map(d => moment(d).format('YYYY-MM-DD'));

  // Verifica si ya se ha registrado el nombre
  db.ref('turnos/' + currentMonth).once('value', (snapshot) => {
    let alreadyRegistered = false;
    snapshot.forEach((childSnapshot) => {
      let data = childSnapshot.val();
      if (data.nombre === nombreUsuario) {
        alreadyRegistered = true;
        alert("Ya te has registrado este mes.");
        return;
      }
    });

    if (!alreadyRegistered) {
      fechaTurnos.forEach(fecha => {
        let turnosRef = db.ref('turnos/' + currentMonth + '/' + fecha);
        turnosRef.once('value', (snapshot) => {
          let turnos = snapshot.val() || { turnos: [] };
          if (turnos.turnos.length < 5) {
            turnos.turnos.push({ nombre: nombreUsuario });
            turnosRef.set(turnos);
          } else {
            alert(`El día ${fecha} ya tiene el cupo completo.`);
          }
        });
      });
    }
  });

  // Reset form and calendar
  document.getElementById("nombre").value = '';
  seleccionDias = [];
  $('#calendar').fullCalendar('destroy');
  document.getElementById("formulario").style.display = 'block';
  document.getElementById("calendario").style.display = 'none';
}
