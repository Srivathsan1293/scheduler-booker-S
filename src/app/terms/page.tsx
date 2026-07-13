import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Digvijaya Yatra Booker - Intelligent appointment scheduling platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Digvijaya Yatra Booker (&quot;the
                Service&quot;), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by
                the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 mb-4">
                Digvijaya Yatra Booker is an intelligent appointment scheduling and
                booking platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Create and manage availability schedules</li>
                <li>Accept online bookings from clients</li>
                <li>Manage appointments and bookings</li>
                <li>Share booking links with clients</li>
                <li>Set up automated scheduling preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. User Accounts
              </h2>
              <p className="text-gray-700 mb-4">
                To use our Service, you must create an account. You are
                responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Providing accurate and complete information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Interfere with the Service&apos;s operation</li>
                <li>Create fake or misleading appointments</li>
                <li>Spam or send unsolicited communications</li>
                <li>Attempt to gain unauthorized access to the system</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Booking and Scheduling
              </h2>
              <p className="text-gray-700 mb-4">
                Users who create booking links are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Honoring confirmed bookings and appointments</li>
                <li>Providing accurate availability information</li>
                <li>Communicating any changes or cancellations promptly</li>
                <li>Maintaining professional conduct during appointments</li>
              </ul>
              <p className="text-gray-700 mb-4">
                We are not responsible for disputes between service providers
                and clients regarding bookings, payments, or service quality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Data and Privacy
              </h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the Service, to
                understand our practices.
              </p>
              <p className="text-gray-700 mb-4">
                You retain ownership of your data. By using the Service, you
                grant us a limited license to store, process, and display your
                data as necessary to provide the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Service Availability
              </h2>
              <p className="text-gray-700 mb-4">
                We strive to maintain high service availability, but we do not
                guarantee uninterrupted access. The Service may be temporarily
                unavailable due to maintenance, updates, or technical issues.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Intellectual Property
              </h2>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and
                functionality are owned by Digvijaya Yatra Booker and are protected by
                international copyright, trademark, and other intellectual
                property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Termination
              </h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without
                prior notice, for conduct that we believe violates these Terms
                or is harmful to other users, us, or third parties.
              </p>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting us or
                using account deletion features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Disclaimers
              </h2>
              <p className="text-gray-700 mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF
                ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                IN NO EVENT SHALL Digvijaya Yatra Booker BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE,
                GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Changes to Terms
              </h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will
                notify users of any material changes via email or through the
                Service. Your continued use of the Service after such
                modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> luizavalos40@gmail.com
                  <br />
                  <strong>Website:</strong> https://scheduler-booker.vercel.app
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Governing Law
              </h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be interpreted and governed by the laws of the
                jurisdiction in which Digvijaya Yatra Booker operates, without regard
                to conflict of law provisions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
