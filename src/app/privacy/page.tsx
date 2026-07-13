import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Digvijaya Yatra Booker - How we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 mb-4">
                Digvijaya Yatra Booker (&quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;) is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our scheduling and
                booking platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.1 Personal Information
              </h3>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Account information (name, email address, password)</li>
                <li>
                  Profile information (business name, timezone, preferences)
                </li>
                <li>Availability and scheduling data</li>
                <li>Booking information and appointment details</li>
                <li>Communications with us (support requests, feedback)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.2 Automatically Collected Information
              </h3>
              <p className="text-gray-700 mb-4">
                We automatically collect certain information when you use our
                Service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>
                  Device information (browser type, operating system, IP
                  address)
                </li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log data (access times, error logs)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide and maintain the Service</li>
                <li>Process bookings and manage appointments</li>
                <li>Send notifications about bookings and schedule changes</li>
                <li>Improve our Service and develop new features</li>
                <li>Provide customer support</li>
                <li>Communicate with you about the Service</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information. We may
                share your information in the following circumstances:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4.1 Service Providers
              </h3>
              <p className="text-gray-700 mb-4">
                We may share information with third-party service providers who
                assist us in operating our Service, such as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Cloud hosting providers (Supabase)</li>
                <li>Email service providers</li>
                <li>Analytics services</li>
                <li>Payment processors (if applicable)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4.2 Legal Requirements
              </h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law or in
                response to valid legal requests.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4.3 Business Transfers
              </h3>
              <p className="text-gray-700 mb-4">
                In the event of a merger, acquisition, or sale of assets, your
                information may be transferred as part of that transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure hosting infrastructure</li>
              </ul>
              <p className="text-gray-700 mb-4">
                However, no method of transmission over the internet or
                electronic storage is 100% secure. While we strive to protect
                your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Data Retention
              </h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to provide
                the Service and fulfill the purposes outlined in this Privacy
                Policy. We may retain certain information for longer periods for
                legitimate business purposes, legal compliance, or dispute
                resolution.
              </p>
              <p className="text-gray-700 mb-4">
                When you delete your account, we will delete or anonymize your
                personal information, except where retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Your Rights and Choices
              </h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and personal information</li>
                <li>Opt out of certain communications</li>
                <li>Export your data</li>
                <li>Object to processing of your information</li>
              </ul>
              <p className="text-gray-700 mb-4">
                To exercise these rights, please contact us using the
                information provided in the Contact section below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your
                experience on our Service. Cookies are small text files stored
                on your device that help us:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze how you use our Service</li>
                <li>Improve performance and functionality</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookie settings through your browser
                preferences, but disabling cookies may affect the functionality
                of our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Third-Party Services
              </h2>
              <p className="text-gray-700 mb-4">
                Our Service may contain links to third-party websites or
                services. This Privacy Policy does not apply to those
                third-party services. We encourage you to review the privacy
                policies of any third-party services you access.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. International Data Transfers
              </h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in
                countries other than your country of residence. We ensure that
                such transfers comply with applicable data protection laws and
                implement appropriate safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Children&apos;s Privacy
              </h2>
              <p className="text-gray-700 mb-4">
                Our Service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If we become aware that we have collected personal
                information from a child under 13, we will take steps to delete
                such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new Privacy
                Policy on this page and updating the &quot;Last updated&quot;
                date. We encourage you to review this Privacy Policy
                periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our
                privacy practices, please contact us at:
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
                14. Compliance
              </h2>
              <p className="text-gray-700 mb-4">
                This Privacy Policy is designed to comply with applicable
                privacy laws, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Other applicable regional privacy laws</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
