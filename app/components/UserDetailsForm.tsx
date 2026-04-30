import React, { useEffect, useState } from "react";
import { CustomInput } from "./CustomInput";

type UserDetailsFormType = {
  name: string;
  surname: string;
  email: string;
  phone: string;
};

interface UserDetailsFormProps {
  data: UserDetailsFormType;
  updateFields: (fields: Partial<UserDetailsFormType>) => void;
  onValidationChange: (isValid: boolean) => void; 
}


export default function UserDetailsForm({ data, updateFields, onValidationChange }: UserDetailsFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof UserDetailsFormType, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof UserDetailsFormType, boolean>>>({});

  const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

 const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserDetailsFormType, string>> = {};

    if (!data.name.trim()) {
      newErrors.name = "First name is required";
    } else if (!namePattern.test(data.name.trim())) {
      newErrors.name = "Please enter a valid first name";
    }

    if (!data.surname.trim()) {
      newErrors.surname = "Surname is required";
    } else if (!namePattern.test(data.surname.trim())) {
      newErrors.surname = "Please enter a valid surname";
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!data.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?\d{7,15}$/.test(data.phone)) {
      newErrors.phone = "Phone number is invalid";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    // Notify parent about validation state
    onValidationChange(isValid);
    
    return isValid;
  };



   useEffect(() => {
      const hasTouchedAnyField = Object.values(touched).some((t) => t);
      if (hasTouchedAnyField) {
        validate();
      }
    }, [data, touched]);

  const validateField = (field: keyof UserDetailsFormType) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!data.name.trim()) {
          newErrors.name = "First name is required";
        } else if (!namePattern.test(data.name.trim())) {
          newErrors.name = "Please enter a valid first name";
        } else {
          delete newErrors.name;
        }
        break;
      case 'surname':
        if (!data.surname.trim()) {
          newErrors.surname = "Surname is required";
        } else if (!namePattern.test(data.surname.trim())) {
          newErrors.surname = "Please enter a valid surname";
        } else {
          delete newErrors.surname;
        }
        break;
      case 'email':
        if (!data.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          newErrors.email = "Email is invalid";
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (!data.phone.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!/^\+?\d{7,15}$/.test(data.phone)) {
          newErrors.phone = "Phone number is invalid";
        } else {
          delete newErrors.phone;
        }
        break;
    }
    
    setErrors(newErrors);
  };


  const handleChange = (field: keyof UserDetailsFormType, value: string) => {
    updateFields({ [field]: value });
    
    // Validate field if it was already touched
    if (touched[field]) {
      validateField(field);
    }
  };

  const handleBlur = (field: keyof UserDetailsFormType) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Check if form is valid (no errors and has required data)
  const isFormValid = Object.keys(errors).length === 0 && 
                     data.name.trim() && 
                     data.surname.trim() && 
                     data.email.trim() && 
                     data.phone.trim();

  return (<div className="space-y-4 mt-4" id = 'errorSection'>
      <p>STEP 2: YOUR DETAILS</p>

      {/* First Name */}
      <div>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="First Name"
          className="w-full p-2 border rounded"
          style={{ borderColor: errors.name ? "red" : undefined }}
        />
        {errors.name && touched.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Surname */}
      <div>
        <input
          type="text"
          value={data.surname}
          onChange={(e) => handleChange("surname", e.target.value)}
          onBlur={() => handleBlur("surname")}
          placeholder="Surname"
          className="w-full p-2 border rounded"
          style={{ borderColor: errors.surname ? "red" : undefined }}
        />
        {errors.surname && touched.surname && (
          <p className="text-red-500 text-sm mt-1">{errors.surname}</p>
        )}
      </div>

      {/* Email Address */}
      <div>
        <input
          type="email"
          value={data.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          placeholder="Email Address"
          className="w-full p-2 border rounded"
          style={{ borderColor: errors.email ? "red" : undefined }}
        />
        {errors.email && touched.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder="Phone Number"
          className="w-full p-2 border rounded"
          style={{ borderColor: errors.phone ? "red" : undefined }}
        />
        {errors.phone && touched.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>
    </div>)
}