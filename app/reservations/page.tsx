"use client";

import React from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { SimpleBookingForm } from "../../components/SimpleBookingForm";
import { ReservationList } from "../../components/ReservationList";

const ReservationPage = () => {
  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">予約システム</h1>
          <p className="text-gray-600 mb-8">
            授業の予約と管理を行います。
          </p>
        </div>

        <div className="space-y-8">
          <SimpleBookingForm 
            onSubmit={async (data) => {
              console.log('Booking submitted:', data);
              return true;
            }}
            existingReservations={[]}
            loading={false}
          />
          
          <ReservationList 
            reservations={[]}
            onCancel={async (id) => {
              console.log('Cancel reservation:', id);
              return true;
            }}
            loading={false}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ReservationPage;