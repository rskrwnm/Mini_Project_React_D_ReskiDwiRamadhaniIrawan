import React, { useState } from 'react';

function Contact() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [pesan, setPesan] = useState('');
  const [isPesanTerkirim, setIsPesanTerkirim] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    setIsPesanTerkirim(true);
    setNama('');
    setEmail('');
    setPesan('');
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-semibold text-center mb-6">Contact Us</h2>
      <div className="bg-white shadow-md rounded-lg p-8 mb-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nama" className="block text-gray-600 text-sm font-semibold mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="nama"
              className="mt-1 p-2 w-full border-b-2 border-blue-300 focus:outline-none"
              placeholder="Enter your name"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600 text-sm font-semibold mb-2">
              Your Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 p-2 w-full border-b-2 border-blue-300 focus:outline-none"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pesan" className="block text-gray-600 text-sm font-semibold mb-2">
              Your Message
            </label>
            <textarea
              id="pesan"
              className="mt-1 p-2 w-full border-b-2 border-blue-300 focus:outline-none"
              rows="4"
              placeholder="Type your message here"
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Submit
          </button>
        </form>
        {isPesanTerkirim && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
            <strong>Message Sent!</strong> Thank you, {nama}. Your message has been sent successfully.
          </div>
        )}
      </div>
    </div>
  );
}

export default Contact;
