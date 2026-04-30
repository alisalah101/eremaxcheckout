import React, { forwardRef } from "react";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  required?: boolean;
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ type = "text", placeholder, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className="custom-input"
        {...rest} 
      />
    );
  }
);

CustomInput.displayName = "CustomInput";

// CustomInput.tsx
// import React, { forwardRef } from "react";

// interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
//   // `required` is now optional to avoid TypeScript errors with react-hook-form
//   required?: boolean;
// }

// export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
//   ({ type = "text", placeholder, className = "", ...rest }, ref) => {
//     return (
//       <input
//         ref={ref}
//         type={type}
//         placeholder={placeholder}
//         className={`custom-input ${className}`}
//         {...rest} // includes name, onChange, onBlur, etc.
//       />
//     );
//   }
// );

// CustomInput.displayName = "CustomInput";
