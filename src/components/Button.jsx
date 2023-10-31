const Button = ({ id, label, type, onClick }) => {
    return (
      <button
        id={id}
        type={type}
        className={`w-full h-full bg-orange-500 text-white border-none focus:outline-none flex items-center justify-center`}
        onClick={onClick}
      >
        {label}
      </button>
    );
  };
  
  export default Button;
  