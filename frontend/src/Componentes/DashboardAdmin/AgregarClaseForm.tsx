
import React, { useState } from 'react';

const AgregarClaseForm = ({ onAddClass }) => {
  const [nombre, setNombre] = useState('');
  const [profesor, setProfesor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !profesor) return; // Validación simple
    
    // Llama a la función pasada por props con los datos del formulario
    onAddClass({ nombre, profesor, fecha: new Date().toLocaleDateString() });

    // Limpia el formulario
    setNombre('');
    setProfesor('');
  };

  return (
    <div className="form-container">
      <h3>Agregar Nueva Clase</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre de la Clase</label>
          <input 
            type="text" 
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: React desde Cero"
          />
        </div>
        <div className="form-group">
          <label htmlFor="profesor">Nombre del Profesor</label>
          <input 
            type="text" 
            id="profesor"
            value={profesor}
            onChange={(e) => setProfesor(e.target.value)}
            placeholder="Ej: Juan Pérez"
          />
        </div>
        <button type="submit" className="btn btn-primary">Agregar Clase</button>
      </form>
    </div>
  );
};

export default AgregarClaseForm;
