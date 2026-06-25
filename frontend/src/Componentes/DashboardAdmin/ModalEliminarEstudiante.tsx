import { useState } from 'react';
import './ModalEliminarEstudiante.css';

interface ModalEliminarEstudianteProps {
  estudiante: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  onClose: () => void;
  onConfirm: (data: EliminacionData) => void;
}

export interface EliminacionData {
  razon: string;
  descripcion_adicional: string;
  deuda_pendiente: number;
  plan_activo: string;
  notas: string;
}

export default function ModalEliminarEstudiante({ estudiante, onClose, onConfirm }: ModalEliminarEstudianteProps) {
  const [formData, setFormData] = useState<EliminacionData>({
    razon: 'otro',
    descripcion_adicional: '',
    deuda_pendiente: 0,
    plan_activo: '',
    notas: ''
  });

  const razones = [
    { value: 'termino_clases', label: 'Terminó sus clases' },
    { value: 'no_pago', label: 'No realizó el pago' },
    { value: 'abandono', label: 'Abandonó el curso' },
    { value: 'solicitud_propia', label: 'Solicitud del estudiante' },
    { value: 'comportamiento', label: 'Problemas de comportamiento' },
    { value: 'cambio_horario', label: 'No se adaptó al horario' },
    { value: 'otro', label: 'Otra razón' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="modal-overlay-eliminar">
      <div className="modal-eliminar">
        <div className="modal-header-eliminar">
          <h2>⚠️ Eliminar Estudiante</h2>
          <button className="btn-close-eliminar" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-eliminar">
          <div className="estudiante-info-eliminar">
            <p><strong>Estudiante:</strong> {estudiante.first_name} {estudiante.last_name}</p>
            <p><strong>Email:</strong> {estudiante.email}</p>
            <p><strong>Username:</strong> {estudiante.username}</p>
          </div>

          <div className="warning-box-eliminar">
            <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. El estudiante será eliminado permanentemente del sistema, pero se guardará un registro con la información proporcionada.
          </div>

          <form onSubmit={handleSubmit} className="form-eliminar">
            <div className="form-group-eliminar">
              <label>Razón de eliminación *</label>
              <select
                value={formData.razon}
                onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                required
              >
                {razones.map(razon => (
                  <option key={razon.value} value={razon.value}>
                    {razon.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-eliminar">
              <label>Descripción adicional</label>
              <textarea
                value={formData.descripcion_adicional}
                onChange={(e) => setFormData({ ...formData, descripcion_adicional: e.target.value })}
                placeholder="Detalles adicionales sobre la eliminación..."
                rows={3}
              />
            </div>

            <div className="form-row-eliminar">
              <div className="form-group-eliminar">
                <label>Plan activo</label>
                <input
                  type="text"
                  value={formData.plan_activo}
                  onChange={(e) => setFormData({ ...formData, plan_activo: e.target.value })}
                  placeholder="Ej: Plan Mensual"
                />
              </div>

              <div className="form-group-eliminar">
                <label>Deuda pendiente ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deuda_pendiente}
                  onChange={(e) => setFormData({ ...formData, deuda_pendiente: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group-eliminar">
              <label>Notas del administrador</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales para el registro..."
                rows={3}
              />
            </div>

            <div className="modal-actions-eliminar">
              <button type="button" className="btn-cancelar-eliminar" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-confirmar-eliminar">
                Confirmar Eliminación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
