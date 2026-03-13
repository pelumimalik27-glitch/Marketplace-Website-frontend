import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, MessageSquare, AlertTriangle } from 'lucide-react';

function DisputePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [disputeData, setDisputeData] = useState({
    reason: '',
    description: '',
    expectedResolution: 'refund',
    evidence: [],
  });
  
  const reasons = [
    'Item not received',
    'Item damaged',
    'Item not as described',
    'Wrong item received',
    'Quality issues',
    'Seller not responsive',
    'Other',
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDisputeData({
      ...disputeData,
      evidence: [...disputeData.evidence, ...files.map(file => ({
        name: file.name,
        type: file.type,
        preview: URL.createObjectURL(file),
      }))],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit dispute logic would go here
    alert('Dispute filed successfully! We will review your case within 48 hours.');
    navigate('/orderpage');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Orders
      </button>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={24} className="text-orange-600" />
          <h1 className="text-2xl font-bold">File a Dispute</h1>
        </div>
        
        <p className="text-gray-600 mb-8">
          Order #{orderId} • Please provide details about your issue
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              What is the reason for your dispute? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reasons.map(reason => (
                <label key={reason} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={disputeData.reason === reason}
                    onChange={(e) => setDisputeData({...disputeData, reason: e.target.value})}
                    className="text-orange-600 mr-3"
                    required
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Please describe the issue in detail *
            </label>
            <textarea
              value={disputeData.description}
              onChange={(e) => setDisputeData({...disputeData, description: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows="4"
              placeholder="Include specific details about what happened, when you noticed the issue, and what you've already tried..."
              required
            />
          </div>

          {/* Expected Resolution */}
          <div>
            <label className="block text-sm font-medium mb-3">
              What resolution are you seeking? *
            </label>
            <select
              value={disputeData.expectedResolution}
              onChange={(e) => setDisputeData({...disputeData, expectedResolution: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="refund">Full refund</option>
              <option value="partial">Partial refund</option>
              <option value="replacement">Replacement item</option>
              <option value="return">Return for exchange</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Upload Evidence (Optional but recommended)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drag & drop files here, or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Supported: JPG, PNG, PDF up to 10MB each</p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="evidence-upload"
                accept="image/*,.pdf"
              />
              <label
                htmlFor="evidence-upload"
                className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 cursor-pointer"
              >
                Browse Files
              </label>
            </div>
            
            {/* Uploaded Files Preview */}
            {disputeData.evidence.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Uploaded files:</p>
                <div className="flex flex-wrap gap-2">
                  {disputeData.evidence.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      {file.type.startsWith('image/') ? (
                        <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs">PDF</span>
                        </div>
                      )}
                      <span className="text-sm">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Terms & Submission */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageSquare size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">What happens next?</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Your dispute will be reviewed by our support team within 48 hours. 
                    The seller will be notified and given 72 hours to respond. 
                    We may contact you for additional information.
                  </p>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <span className="font-bold">Note:</span> 
                  Filing false disputes is against our terms of service and may result in account suspension.
                  Please ensure all information provided is accurate.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-medium"
            >
              Submit Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DisputePage;