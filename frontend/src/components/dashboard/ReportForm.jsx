import { useState, useRef, useEffect } from 'react';
import { uploadAPI } from '../../services/api';
import './ReportForm.css';

const ReportForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    wasteType: 'household',
    estimatedWeight: 'less_than_5kg',
    location: {
      address: '',
      coordinates: { lat: null, lng: null }
    },
    images: []
  });
  
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [message, setMessage] = useState('');
  const [timestamp] = useState(new Date());
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const wasteTypes = [
    { value: 'household', label: 'Household Waste', icon: '🏠', points: 10 },
    { value: 'recyclable', label: 'Recyclables', icon: '♻️', points: 25 },
    { value: 'ewaste', label: 'E-Waste', icon: '💻', points: 50 },
    { value: 'organic', label: 'Organic Waste', icon: '🌿', points: 15 },
    { value: 'hazardous', label: 'Hazardous', icon: '☢️', points: 40 },
    { value: 'mixed', label: 'Mixed Waste', icon: '🗑️', points: 10 }
  ];

  const weightOptions = [
    { value: 'less_than_5kg', label: 'Less than 5 kg', multiplier: '1x' },
    { value: '5_to_10kg', label: '5 - 10 kg', multiplier: '1.5x' },
    { value: '10_to_20kg', label: '10 - 20 kg', multiplier: '2x' },
    { value: 'more_than_20kg', label: 'More than 20 kg', multiplier: '3x' }
  ];

  // Auto-fetch GPS on component mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Fetching your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { lat: latitude, lng: longitude }
          }
        }));

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                address: data.display_name
              }
            }));
          }
          setGpsStatus('Location captured successfully!');
        } catch (error) {
          setGpsStatus('Location coordinates captured');
        }
        
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsStatus('Location access denied. Please enter address manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsStatus('Location unavailable. Please enter address manually.');
            break;
          case error.TIMEOUT:
            setGpsStatus('Location request timed out. Please try again.');
            break;
          default:
            setGpsStatus('Unable to get location. Please enter address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images
    if (imagePreviews.length + files.length > 5) {
      setMessage('Maximum 5 images allowed');
      return;
    }

    // Validate file sizes (max 5MB each)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setMessage(`${file.name} is too large. Max size is 5MB`);
        return false;
      }
      return true;
    });

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, {
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id) => {
    setImagePreviews(prev => prev.filter(img => img.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length > 100) newErrors.title = 'Title cannot exceed 100 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 500) newErrors.description = 'Description cannot exceed 500 characters';
    if (!formData.location.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, address: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      let imageUrls = [];

      // Upload images if any
      if (imagePreviews.length > 0) {
        setUploadingImages(true);
        const files = imagePreviews.map(p => p.file);
        const uploadResponse = await uploadAPI.uploadImages(files);
        imageUrls = uploadResponse.data.data.urls;
        setUploadingImages(false);
      }

      // Submit report with image URLs
      await onSubmit({
        ...formData,
        images: imageUrls
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting report');
      setUploadingImages(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedWasteType = wasteTypes.find(w => w.value === formData.wasteType);
  const selectedWeight = weightOptions.find(w => w.value === formData.estimatedWeight);

  return (
    <div className="report-form-container">
      <div className="form-header">
        <h2>📝 Report Garbage</h2>
        <p>Help keep your community clean by reporting garbage that needs collection</p>
      </div>

      {/* Timestamp Display */}
      <div className="timestamp-display">
        <span className="timestamp-icon">🕐</span>
        <span className="timestamp-text">{formatTimestamp(timestamp)}</span>
      </div>

      {message && (
        <div className="alert alert-error">{message}</div>
      )}

      <form onSubmit={handleSubmit} className="garbage-report-form">
        {/* Image Upload Section */}
        <div className="form-section">
          <label className="section-label">
            <span>📷</span> Upload Photos (up to 5)
          </label>
          
          <div className="image-upload-area">
            {imagePreviews.length < 5 && (
              <div className="upload-trigger-group">
                <div 
                  className="upload-trigger"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">📤</div>
                  <span>Upload from device</span>
                  <span className="upload-hint">JPEG, PNG, GIF, WebP • Max 5MB each</span>
                </div>
                <div
                  className="upload-trigger capture-trigger"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <div className="upload-icon">📸</div>
                  <span>Capture photo</span>
                  <span className="upload-hint">Use device camera directly</span>
                </div>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map(img => (
                  <div key={img.id} className="image-preview">
                    <img src={img.url} alt={img.name} />
                    <button 
                      type="button"
                      className="remove-image"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="form-section">
          <label className="section-label">
            <span>📍</span> Location
          </label>
          
          <div className="location-input-group">
            <div className="gps-status">
              <span className={`gps-indicator ${formData.location.coordinates.lat ? 'active' : ''}`}></span>
              <span className="gps-text">{gpsStatus || 'GPS location not captured'}</span>
              <button 
                type="button" 
                className="btn btn-small btn-outline"
                onClick={handleGetLocation}
                disabled={gpsLoading}
              >
                {gpsLoading ? 'Locating...' : '🔄 Refresh GPS'}
              </button>
            </div>

            {formData.location.coordinates.lat && (
              <div className="coordinates-display">
                <span>Lat: {formData.location.coordinates.lat.toFixed(6)}</span>
                <span>Lng: {formData.location.coordinates.lng.toFixed(6)}</span>
              </div>
            )}

            <input
              type="text"
              name="address"
              value={formData.location.address}
              onChange={handleChange}
              placeholder="Enter or confirm pickup address..."
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>
        </div>

        {/* Title & Description */}
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Large pile of recyclables near park"
            className={errors.title ? 'error' : ''}
            maxLength={100}
          />
          <div className="char-count">{formData.title.length}/100</div>
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the garbage type, approximate quantity, and any special handling requirements..."
            rows={4}
            className={errors.description ? 'error' : ''}
            maxLength={500}
          />
          <div className="char-count">{formData.description.length}/500</div>
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        {/* Waste Type Selection */}
        <div className="form-section">
          <label className="section-label">
            <span>🗑️</span> Waste Type
          </label>
          <div className="waste-type-grid">
            {wasteTypes.map(type => (
              <button
                key={type.value}
                type="button"
                className={`waste-type-btn ${formData.wasteType === type.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, wasteType: type.value }))}
              >
                <span className="waste-icon">{type.icon}</span>
                <span className="waste-label">{type.label}</span>
                <span className="waste-points">+{type.points} pts</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weight Estimation */}
        <div className="form-group">
          <label htmlFor="estimatedWeight">Estimated Weight</label>
          <div className="weight-options">
            {weightOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`weight-btn ${formData.estimatedWeight === option.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, estimatedWeight: option.value }))}
              >
                <span className="weight-label">{option.label}</span>
                <span className="weight-multiplier">{option.multiplier}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Points Estimate */}
        <div className="points-estimate">
          <span className="points-icon">🏆</span>
          <span className="points-text">
            Estimated Reward: <strong>{selectedWasteType?.points || 0} × {selectedWeight?.multiplier || '1x'}</strong> points
          </span>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {uploadingImages ? 'Uploading Images...' : loading ? 'Submitting...' : '📤 Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
