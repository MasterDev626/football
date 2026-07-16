"use client";

import Image from "next/image";
import { useState } from "react";

export function PaymentPanel({
  priceCzk,
  account,
  bankCode,
  message,
}: {
  priceCzk: number;
  account: string;
  bankCode: string;
  message: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const fullAccount = `${account}/${bankCode}`;

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <section className="payment-panel animate-rise">
      <div className="payment-panel-head">
        <h2>Pay Dome</h2>
        <span className="payment-amount">{priceCzk} CZK</span>
      </div>
      <p className="payment-lead">
        Bank transfer or scan Revolut / SPD QR. Put the day in the message so
        Dome can match your payment.
      </p>

      <div className="payment-grid">
        <div className="payment-details">
          <div className="pay-row">
            <span>Account</span>
            <strong>{fullAccount}</strong>
            <button
              type="button"
              className="btn-tiny"
              onClick={() => copy("account", fullAccount)}
            >
              {copied === "account" ? "✓" : "Copy"}
            </button>
          </div>
          <div className="pay-row">
            <span>Amount</span>
            <strong>{priceCzk}.00 CZK</strong>
          </div>
          <div className="pay-row">
            <span>Message</span>
            <strong>{message}</strong>
            <button
              type="button"
              className="btn-tiny"
              onClick={() => copy("msg", message)}
            >
              {copied === "msg" ? "✓" : "Copy"}
            </button>
          </div>
          <p className="payment-example">
            Please send {priceCzk}.00 CZK to account {fullAccount}, message for
            recipient: {message}. Thank you.
          </p>
        </div>

        <figure className="qr-wrap">
          <div className="qr-glow" aria-hidden />
          <Image
            src="/revolut-qr.jpg"
            alt="Payment QR for Dome (Revolut / bank SPD)"
            width={220}
            height={204}
            className="qr-image"
            priority
          />
          <figcaption>Scan to pay</figcaption>
        </figure>
      </div>
    </section>
  );
}
