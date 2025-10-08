export interface PublicReservationEventDto {
  version: "v1";
  channel: string;
  event: "reservation" | "cancellation" | "modification";
  hotel_id: number;
  reservation: {
    guest: {
      full_name?: string;
      email?: string;
      phone_number?: string;
      address?: string;
    };
    stay: {
      roomtype_id?: number;
      room_number?: string;
      start_date?: string | Date;
      end_date?: string | Date;
      number_of_guests?: number;
    };
    payment?: {
      amount_paid?: number;
      outstanding?: number;
      payment_method?: string;
      receiving_account?: string;
      currency?: string;
    };
    meta?: {
      created_at?: Date;
      source_reservation_id?: string;
    };
  };
  oreon_guest_dto?: any;
}