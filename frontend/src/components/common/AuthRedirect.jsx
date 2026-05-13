import { Link } from 'react-router-dom';

function AuthRedirect({ text, linkText, to }) {
  return (
    <p className="mt-6 text-sm text-muted-foreground">
      {text}{' '}
      <Link to={to} className="text-primary font-medium">
        {linkText}
      </Link>
    </p>
  );
}

export default AuthRedirect;
