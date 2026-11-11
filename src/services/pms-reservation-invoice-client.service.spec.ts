import { HttpService } from "@nestjs/axios";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { of } from "rxjs";
import { PmsReservationClient } from "./pms-reservation-client.service";

describe("PmsReservationClient invoice generation", () => {
  const http = { post: jest.fn() };
  const client = new PmsReservationClient(http as unknown as HttpService);

  beforeEach(() => {
    process.env.PMS_RESERVATION_FORWARD = "true";
    process.env.PMS_RESERVATION_CREATE_URL =
      "https://oreon.example.com/api/v1/partner/channel/bookings";
    process.env.PMS_API_KEY = "test-key";
    http.post.mockReset();
  });

  afterEach(() => {
    delete process.env.PMS_RESERVATION_FORWARD;
    delete process.env.PMS_RESERVATION_CREATE_URL;
    delete process.env.PMS_API_KEY;
  });

  it("requests and returns the invoice PDF as bytes", async () => {
    const pdf = Buffer.from("%PDF-1.4 invoice");
    http.post.mockReturnValue(of({ status: 200, data: pdf }));

    await expect(client.generateGuestInvoice("OTA/123", 8)).resolves.toEqual({
      success: true,
      status: 200,
      data: pdf,
    });

    expect(http.post).toHaveBeenCalledWith(
      "https://oreon.example.com/api/v1/partner/channel/bookings/OTA%2F123/invoice",
      { hotelId: 8 },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-key",
        },
        responseType: "arraybuffer",
      },
    );
  });
});
