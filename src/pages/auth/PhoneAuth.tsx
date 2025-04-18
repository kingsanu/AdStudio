/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, X, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneNumberInput from "@/components/ui/phone-number-input";
import { API_URLS, AUTH_RESPONSES, AUTH_STATES } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { COUNTRY_CODES } from "@/constants/country-codes";
import { IconMoodHappy } from "@tabler/icons-react";
import { useSearchParams, useNavigate } from "react-router-dom";

function PhoneAuth() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("IN");
  // Business details for account creation
  const [businessDetails, setBusinessDetails] = useState({
    name: "",
    address: "",
    description: "",
    logo: null as File | null,
    email: "",
    fullName: "",
    city: "",
    area: "",
  });

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const businessFormRef = useRef<HTMLDivElement>(null);

  const handlePhoneChange = (value: string) => {
    setError("");
    // Only allow digits
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    setError("");
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleBusinessDetailChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBusinessDetails({
      ...businessDetails,
      [name]: value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBusinessDetails({
        ...businessDetails,
        logo: e.target.files[0],
      });
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    console.log(phoneNumber);
    // let country = "IN";
    const countryCode = COUNTRY_CODES[country];
    const fullPhoneNumber = countryCode + phoneNumber;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URLS.BASE_URL}${API_URLS.VERIFY_MOBILE}?Phone=${fullPhoneNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response;
      console.log(data);
      if (data.status === 200) {
        setAuthState(AUTH_STATES.OTP_VERIFICATION);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Send OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }

    const countryCode = COUNTRY_CODES[country];
    const fullPhoneNumber = countryCode + phoneNumber;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URLS.BASE_URL}${API_URLS.VERIFY_OTP}?Phone=${fullPhoneNumber}&OTP=${otpValue}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log(data);

      if (data.result === "GOTO_CREATEACCOUNT_PAGE") {
        setAuthState(AUTH_STATES.ACCOUNT_CREATION);
      } else if (
        data.result === "ACCOUNT_EXIST_PULL_EVERYTHING_NEW" &&
        data.outletId
      ) {
        // For existing accounts, use outletId as the token
        const countryCode = COUNTRY_CODES[country];
        const fullPhoneNumber = countryCode + phoneNumber;
        login(data.outletId, {
          phoneNumber: fullPhoneNumber,
          userId: data.outletId,
          name: "User", // Adding required name property
        });
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Verify OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    // Validate business details
    if (!businessDetails.name || !businessDetails.address) {
      setError("Business name and address are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      const countryCode = COUNTRY_CODES[country];
      const fullPhoneNumber = countryCode + phoneNumber;

      formData.append("FullName", businessDetails.fullName);
      formData.append("Phone", fullPhoneNumber);
      formData.append("RestaurantName", businessDetails.name);
      formData.append("Address", businessDetails.address);
      formData.append("City", businessDetails.city);
      formData.append("Area", businessDetails.area);
      formData.append("RestauntPhone", fullPhoneNumber);

      if (businessDetails.logo) {
        // Convert logo to base64 string
        const reader = new FileReader();
        reader.readAsDataURL(businessDetails.logo);

        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            const base64Logo = reader.result?.toString().split(",")[1];
            if (base64Logo) {
              formData.append("logo", base64Logo);
              resolve();
            } else {
              reject(new Error("Failed to convert logo to base64"));
            }
          };
          reader.onerror = () => reject(reader.error);
        });
      }

      // API endpoint for account creation
      const response = await fetch(API_URLS.BASE_URL + "/CreateAccount", {
        method: "POST",
        body: formData,
      });
      console.log(response);
      const token = await response.text();
      console.log(token);
      // The API returns the token directly as text, not JSON
      if (token) {
        // Convert logo File to string URL if it exists, otherwise pass undefined
        const logoUrl = businessDetails.logo
          ? URL.createObjectURL(businessDetails.logo)
          : undefined;

        login(token, {
          phoneNumber: fullPhoneNumber,
          userId: token, // Store the token (outletId) as userId
          name: businessDetails.name,
          address: businessDetails.address,
          email: businessDetails.email,
          logo: logoUrl,
          // Removed description as it's not in the UserDetails interface
        });
        // Redirect would happen via authentication context
      } else {
        setError("Failed to create account. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Create account error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch outlet details using outletId
  const fetchOutletDetails = async (outletId: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URLS.ADS_BASE_URL}${API_URLS.CHECK_OUTLET_ID}?outletId=${outletId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch outlet details: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.ID) {
        // Login with the outlet details
        login(data.ID, {
          phoneNumber: data.phone,
          userId: data.ID,
          name: data.restaurantName || data.name,
          address: data.address,
          email: data.email || "",
          logo: data.logo || undefined,
          // Removed description as it's not in the UserDetails interface
        });
      } else {
        // If we couldn't get valid data, show the phone input
        setAuthState(AUTH_STATES.PHONE_INPUT);
        setError("Could not retrieve account details. Please log in manually.");
      }
    } catch (error) {
      console.error("Error fetching outlet details:", error);
      setAuthState(AUTH_STATES.PHONE_INPUT);
      setError("Failed to retrieve account details. Please log in manually.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for outletId in URL and handle authentication
  useEffect(() => {
    const outletId = searchParams.get("outletId");

    if (outletId) {
      // If outletId is present in URL, fetch outlet details and login
      fetchOutletDetails(outletId);
    } else {
      // If no outletId, show normal phone input
      setAuthState(AUTH_STATES.PHONE_INPUT);
    }
  }, [searchParams]);

  // Slide indicator animation
  useEffect(() => {
    // Slide indicator animation can be handled with CSS transitions
    const slides = document.querySelectorAll(".slide-indicator");
    let currentSlide = 0;

    const animateSlider = () => {
      if (slides.length > 0) {
        // Use standard DOM methods instead of GSAP
        if (slides[currentSlide])
          slides[currentSlide].setAttribute(
            "style",
            "opacity: 0.4; transition: opacity 0.3s"
          );
        currentSlide = (currentSlide + 1) % slides.length;
        if (slides[currentSlide])
          slides[currentSlide].setAttribute(
            "style",
            "opacity: 1; transition: opacity 0.3s"
          );
      }
    };

    const interval = setInterval(animateSlider, 3000);
    return () => clearInterval(interval);
  }, []);

  // Render phone input UI
  const renderPhoneInput = () => (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mb-8"
      >
        <h1 className="text-4xl font-semibold">Sign In</h1>
        <p className="text-slate-500 text-base">
          Enter your phone number to receive a one-time passcode.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-6 w-full"
      >
        <PhoneNumberInput
          value={phoneNumber}
          onChange={handlePhoneChange}
          error=""
          country={country}
          onCountryChange={setCountry}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex items-center gap-2">
          <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-sm text-gray-600">Remember me for 30 days</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSendOtp}
          disabled={isLoading}
          className="w-full py-2 px-8 bg-[#0070f3] hover:bg-[#005bb5] rounded-md text-white font-medium shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Get OTP"}
        </motion.button>
      </motion.div>
    </>
  );

  // Render OTP verification UI
  const renderOtpVerification = () => (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mb-8"
      >
        <h1 className="text-4xl font-semibold">Verify OTP</h1>
        <p className="text-slate-500 text-base">
          Enter the 4-digit code sent to {phoneNumber}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-6 w-full"
      >
        <div className="flex gap-3 justify-center mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={otpRefs[index]}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-xl border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-150 ease-in-out"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-between">
          <button
            onClick={() => setAuthState(AUTH_STATES.PHONE_INPUT)}
            className="text-blue-600 text-sm font-medium"
          >
            Change Phone Number
          </button>
          <button
            onClick={handleSendOtp}
            className="text-blue-600 text-sm font-medium"
          >
            Resend OTP
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerifyOtp}
          disabled={isLoading}
          className="w-full py-2 px-8 bg-[#0070f3] hover:bg-[#005bb5] rounded-md text-white font-medium shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Verify & Continue"}
        </motion.button>
      </motion.div>
    </>
  );

  // Render account creation form with Framer Motion animations
  const renderAccountCreation = () => (
    <motion.div
      ref={businessFormRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mb-6"
      >
        <h1 className="text-4xl font-semibold">Create Your Account</h1>
        <p className="text-slate-500 text-base">
          Tell us about your business to get started with FoodyQueen
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 w-full"
      >
        {/* Business Logo Upload */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="logo">Business Logo</Label>
          <div className="flex items-center space-x-4">
            <div
              className={`w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center border ${
                businessDetails.logo ? "border-blue-500" : "border-gray-300"
              }`}
            >
              {businessDetails.logo ? (
                <img
                  src={URL.createObjectURL(businessDetails.logo)}
                  alt="Business Logo"
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <Upload className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <Input
                id="logo"
                type="file"
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
              <Label
                htmlFor="logo"
                className="bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md cursor-pointer text-sm"
              >
                Choose File
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Upload JPG or PNG (max 2MB)
              </p>
            </div>
          </div>
        </div>

        {/* Full Name and Business Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={businessDetails.fullName}
              onChange={handleBusinessDetailChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Business Name */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              name="name"
              value={businessDetails.name}
              onChange={handleBusinessDetailChange}
              placeholder="Enter your business name"
              required
            />
          </div>
        </div>

        {/* Business Address */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="address">Business Address</Label>
          <Input
            id="address"
            name="address"
            value={businessDetails.address}
            onChange={handleBusinessDetailChange}
            placeholder="Enter your business address"
            required
          />
        </div>

        {/* City and Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={businessDetails.city}
              onChange={handleBusinessDetailChange}
              placeholder="Enter city"
              required
            />
          </div>

          {/* Area */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="area">Area</Label>
            <Input
              id="area"
              name="area"
              value={businessDetails.area}
              onChange={handleBusinessDetailChange}
              placeholder="Enter area or neighborhood"
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateAccount}
          disabled={isLoading}
          className="w-full py-2 px-8 bg-[#0070f3] hover:bg-[#005bb5] rounded-md text-white font-medium shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Account"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-slate-500 text-base">Authenticating...</p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex overflow-hidden min-h-[650px]"
      >
        {/* Left Side */}
        <div
          className={`w-full ${
            authState === AUTH_STATES.ACCOUNT_CREATION ? "md:w-3/5" : "md:w-2/5"
          } p-12 relative ${
            authState === AUTH_STATES.ACCOUNT_CREATION ? "order-2" : "order-1"
          }`}
          ref={contentRef}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-md"></div>
            <span className="font-bold text-slate-800 text-3xl">
              Ads Studio
            </span>
          </motion.div>
          <div className="flex flex-col justify-center flex-1 pb-10 relative">
            {authState === AUTH_STATES.LOADING && renderLoading()}
            {authState === AUTH_STATES.PHONE_INPUT && renderPhoneInput()}
            {authState === AUTH_STATES.OTP_VERIFICATION &&
              renderOtpVerification()}
            {authState === AUTH_STATES.ACCOUNT_CREATION &&
              renderAccountCreation()}
          </div>
        </div>

        {/* Right Side */}
        <div
          className={`flex-1 relative overflow-hidden ${
            authState === AUTH_STATES.ACCOUNT_CREATION ? "order-1" : "order-2"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?auto=format&fit=crop&w=1000')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>

          <div className="relative z-10 p-12 h-full flex flex-col justify-between ">
            {/* Modal/Featured Box */}
            <motion.div
              ref={modalRef}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg max-w-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg"></div>
                  <div className="w-10 h-10 bg-blue-600 rounded-lg"></div>
                </div>
                <button className="text-gray-800 hover:text-gray-600">
                  <IconMoodHappy className="w-6 h-6 text-blue-600" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                FoodyQueen Ads Studio
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                A powerful design tool for FoodyQueen — your one-stop solution
                for creating ads, designing attractive menus, and sending bulk
                messages to boost your restaurant's reach.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Create stunning ad designs</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Design professional menus</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Send bulk messages & offers</span>
                </li>
              </ul>
            </motion.div>

            {/* Footer Content */}
            <div className="flex flex-col items-start text-slate-100">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-3xl font-semibold text-start mb-4 text-slate-100"
              >
                FoodyQueen POS & Ads Studio
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-start text-base max-w-lg"
              >
                FoodyQueen is the leading restaurant POS software. With the Ads
                Studio, you can easily create attractive ads, design menus that
                capture customers' attention, and send bulk messages — all in
                one platform.
              </motion.p>

              <div className="flex items-center justify-between mt-8 w-full max-w-xs">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white opacity-100 slide-indicator"></div>
                  <div className="w-2 h-2 rounded-full bg-white opacity-40 slide-indicator"></div>
                  <div className="w-2 h-2 rounded-full bg-white opacity-40 slide-indicator"></div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center transform rotate-180"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default PhoneAuth;
