
import React from 'react';

interface Clase {
  id: number;
  nombre: string;
  profesor: string;
  fecha: string;
}

interface ListaClasesProps {
  clases: Clase[];
  onDeleteClass: (id: number) => void;
}

const ListaClases: React.FC<ListaClasesProps> = ({ clases, onDeleteClass }) => {
  return (
    <div className="list-container">
      <h3>Clases Programadas</h3>
      <table className="classes-table">
        <thead>
          <tr>
            <th>Nombre de la Clase</th>
            <th>Profesor</th>
            <th>Fecha de Creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clases.length > 0 ? (
            clases.map((clase: Clase) => (
              <tr key={clase.id}>
                <td>{clase.nombre}</td>
                <td>{clase.profesor}</td>
                <td>{clase.fecha}</td>
                <td>
                  <button 
                    onClick={() => onDeleteClass(clase.id)} 
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
               <td colSpan={4}>No hay clases programadas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ListaClases;
