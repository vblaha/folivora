import * as ROLE from './ROLES';
import Config from './Config'
import app from './App'
import * as crypto from 'crypto'

export default class Authenticator {
    public static isValid(role, user, token) {
        if (role === ROLE.STUDENT && this.isCodeValid(user, token)) {
            return true;
        } else if (role === ROLE.LECTURER && Authenticator.isTokenValid(user, token)) {
            return true;
        }

        return false;
    }

    public static isTokenValid(user, token) {
        if (user && token && Config.get('lecturer')[user] === token) {
            return true;
        }

        return false;
    }

    public static isCodeValid(user, token) {
        let code = app.getStudentCode();
        let validToken = crypto.createHash('sha256').update(user + '|' + code, 'utf8').digest('hex');

        return validToken === token;
    }
}