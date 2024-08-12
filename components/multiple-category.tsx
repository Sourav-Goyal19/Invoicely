"use client";

import Select from "react-select";

interface SelectCategoriesProps {
  categoryOptions: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}

export const SelectCategories: React.FC<SelectCategoriesProps> = ({
  categoryOptions = [],
  placeholder,
  onChange,
  disabled,
}) => {
  return (
    <Select
      placeholder={placeholder}
      isDisabled={disabled}
      className="text-sm h-10"
      options={categoryOptions}
      onChange={(values) => onChange(values.map((value) => value.value))}
      isMulti={true}
      classNamePrefix="react-select"
    />
  );
};
