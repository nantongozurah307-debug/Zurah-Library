import os
import sys

# Ensure backend package is in the system path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_apscheduler import APScheduler
from backend.models import db
from backend.config import Config

# Import blueprints
from backend.routes.auth import auth_bp
from backend.routes.books import books_bp
from backend.routes.circulation import circulation_bp
from backend.routes.analytics import analytics_bp

# Initialize JWT Manager globally to prevent garbage collection issues
jwt = JWTManager()
scheduler = APScheduler()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure SQLite absolute path inside backend folder
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite:///'):
        db_name = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(backend_dir, db_name)
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    db.init_app(app)
    
    # Initialize JWT Extension on this app
    jwt.init_app(app)
    
    # Initialize APScheduler only if not in testing mode or not running
    if not app.config.get('TESTING') and not scheduler.running:
        scheduler.init_app(app)
        
        from backend.routes.circulation import update_overdue_and_fines
        
        @scheduler.task('cron', id='sweep_overdues', hour='0', minute='0')
        def scheduled_sweep():
            with app.app_context():
                update_overdue_and_fines()
                
        scheduler.start()
    
    # Register JWT custom error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired.', 'code': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Signature verification failed. Invalid token.', 'code': 'token_invalid'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization header is missing.', 'code': 'token_missing'}), 401
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(circulation_bp, url_prefix='/api/circulation')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # Health check
    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'message': 'Public Library API is running'}), 200
        
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found.'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'An internal server error occurred.'}), 500
        
    import sys
    if 'unittest' not in sys.modules:
        with app.app_context():
            db.create_all()
        
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
