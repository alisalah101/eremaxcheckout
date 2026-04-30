import React, { useState, useEffect } from "react";
import { Country, State } from "country-state-city";
import { ICountry, IState } from "country-state-city";

type ShipmentDetailsFormProps = {
  data: {
    country: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
  };
  updateFields: (fields: any) => void;
  onValidationChange: (isValid: boolean) => void;
};

type ShipmentDeatilsFormType = {
  country: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
}

export default function ShipmentDetailsForm({
  data,
  updateFields,
  onValidationChange
}: ShipmentDetailsFormProps) {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<ICountry>();
  const [selectedState, setSelectedState] = useState<IState>();

  // validation state
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof data, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof typeof data, boolean>>
  >({});

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);


  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShipmentDeatilsFormType, string>> = {};

    if (!data.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!data.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!data.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!data.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!data.postcode.trim()) {
      newErrors.postcode = "Postcode is required";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    // Notify parent about validation state
    onValidationChange(isValid);

    return isValid;
  };

  // Run validation whenever data changes
  // useEffect(() => {
  //   validate();
  // }, [data])
  useEffect(() => {
    const hasTouchedAnyField = Object.values(touched).some((t) => t);
    if (hasTouchedAnyField) {
      validate();
    }
  }, [data, touched]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryIsoCode = e.target.value;
    const country = countries.find((c) => c.isoCode === countryIsoCode);

    if (country) {
      const filteredStates = State.getStatesOfCountry(country.isoCode);
      setSelectedCountry(country);
      setSelectedState(undefined);
      setStates(filteredStates);
    }
    updateFields({ country: countryIsoCode });
    validateField("country", countryIsoCode);
  };

  const handleStateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const stateIsoCode = e.target.value;
    const state = states.find((s) => s.isoCode === stateIsoCode);
    setSelectedState(state);
    updateFields({ state: stateIsoCode });
    validateField("state", stateIsoCode);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateFields({ [name]: value });
    if (touched[name as keyof typeof data]) {
      validateField(name as keyof typeof data, value);
    }
  };

  const handleBlur = (field: keyof typeof data) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  };

  // field validation
  const validateField = (field: keyof typeof data, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "country":
        if (!value) newErrors.country = "Country is required";
        else delete newErrors.country;
        break;
      case "address":
        if (!value.trim()) newErrors.address = "Address is required";
        else delete newErrors.address;
        break;
      case "city":
        if (!value.trim()) newErrors.city = "City is required";
        else delete newErrors.city;
        break;
      case "state":
        if (!value) newErrors.state = "State is required";
        else delete newErrors.state;
        break;
      case "postcode":
        if (!value.trim()) newErrors.postcode = "Postcode is required";
        else if (value.length < 4)
          newErrors.postcode = "Postcode is too short";
        else delete newErrors.postcode;
        break;
    }

    setErrors(newErrors);
  };

  return (
    <div className="flex flex-col gap-4 mt-4 mb-6 h-[300px] ">
      <p>STEP 3: SHIPPING INFORMATION</p>
      <form className="flex flex-col gap-4 w-full">
        {/* Country */}
        <div className="">
          <select
            id="country"
            name="country"
            value={data.country}
            onChange={handleCountryChange}
            onBlur={() => handleBlur("country")}
            className="border border-solid p-2 w-[100%]"
            style={{ borderColor: errors.country ? "red" : undefined }}
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && touched.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <input
            className="border border-solid p-2 rounded-sm w-[100%] "
            type="text"
            id="address"
            name="address"
            placeholder="Address"
            value={data.address}
            onChange={handleChange}
            onBlur={() => handleBlur("address")}
            style={{ borderColor: errors.address ? "red" : undefined }}
          />
          {errors.address && touched.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

       
        <div className="flex flex-col sm:flex-row gap-2 rounded-sm justify-between h-[50px]  ">
          {/* State */}
          <div className="sm:w-[70%]  h-full">
            <select
              id="state"
              name="state"
              value={data.state}
              onChange={handleStateChange}
              onBlur={() => handleBlur("state")}
              className="border border-solid px-2 rounded-sm w-full h-[50px]"
              style={{ borderColor: errors.state ? "red" : undefined }}
            >
              <option value="">State/Province*</option>
              {states.map((state) => (
                <option key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors.state && touched.state && (
              <p className="text-red-500 text-sm mt-1">{errors.state}</p>
            )}
          </div>

          {/* Postcode */}
          <div className="sm:w-[25%] h-full">
            <input
              className="border border-solid  px-2 rounded-sm p-2 w-full h-full"
              type="text"
              id="postcode"
              name="postcode"
              placeholder="Postcode"
              value={data.postcode}
              onChange={handleChange}
              onBlur={() => handleBlur("postcode")}
              style={{ borderColor: errors.postcode ? "red" : undefined }}
            />
            {errors.postcode && touched.postcode && (
              <p className="text-red-500 text-sm mt-1">{errors.postcode}</p>
            )}
          </div>

          {/* City */}
          <div className="sm:w-[15%] ">
            <input
              className="border border-solid px-2 rounded-sm p-2 w-full h-full "
              type="text"
              id="city"
              name="city"
              placeholder="City"
              value={data.city}
              onChange={handleChange}
              onBlur={() => handleBlur("city")}
              style={{ borderColor: errors.city ? "red" : undefined }}
            />
            {errors.city && touched.city && (
              <p className="text-red-500 text-sm mt-1 flex flex-row">{errors.city}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
