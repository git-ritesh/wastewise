import ReportForm from './ReportForm';

const CreateReportModal = ({ onClose, onSubmit }) => {
  const handleSubmit = async (reportData) => {
    await onSubmit(reportData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <ReportForm onSubmit={handleSubmit} onCancel={onClose} />
      </div>
    </div>
  );
};

export default CreateReportModal;
