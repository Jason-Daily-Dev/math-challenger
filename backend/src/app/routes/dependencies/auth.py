import os
from typing import Any, Dict, List, Tuple

import requests
from authlib.jose import JsonWebToken
from authlib.jose.errors import BadSignatureError, ExpiredTokenError, JoseError
from dotenv import load_dotenv
from fastapi import Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


class AuthSettings(BaseSettings):
    domain: str = Field(..., alias="AUTH_JWT_DOMAIN")
    audience: str = Field(..., alias="SWAGGER_API_AUDIENCE")
    client_id: str = Field(..., alias="SWAGGER_CLIENT_ID")
    algorithms: List[str] = Field(default=["RS256"])

    class config:
        extra = "ignore"


def get_auth0_config() -> AuthSettings:
    auth_settings = AuthSettings()
    return auth_settings


def get_swagger_auth_components() -> Tuple[OAuth2AuthorizationCodeBearer, JsonWebToken]:
    auth0_config = get_auth0_config()

    oauth2_scheme = OAuth2AuthorizationCodeBearer(
        authorizationUrl=f"https://{auth0_config.domain}/authorize",
        tokenUrl=f"https://{auth0_config.domain}/oauth/token",
    )

    jwt_instance = JsonWebToken(auth0_config.algorithms)
    return oauth2_scheme, jwt_instance


def get_swagger_ui_oauth() -> Dict[str, Any]:
    auth0_config = get_auth0_config()
    return {
        "clientId": auth0_config.client_id,
        "usePkceWithAuthorizationCodeGrant": True,
        "additionalQueryStringParams": {"audience": auth0_config.audience},
    }


def get_token_validator():
    oauth2_scheme, jwt_instance = get_swagger_auth_components()

    async def validate_swagger_token(token: str = Depends(oauth2_scheme)) -> Dict:
        auth0_config = get_auth0_config()
        try:
            jwks_url = f"https://{auth0_config.domain}/.well-known/jwks.json"
            jwks = requests.get(jwks_url).json()

            claims = jwt_instance.decode(
                token,
                key=jwks,
                claims_options={
                    "aud": {"essential": True, "value": auth0_config.audience},
                    "iss": {
                        "essential": True,
                        "value": f"https://{auth0_config.domain}/",
                    },
                },
            )
            claims.validate()
            return claims

        except ExpiredTokenError as e:
            raise Exception(
                f"Token expired: {e}",
            )

        except BadSignatureError as e:
            raise Exception(
                f"Token signature is invalid: {e}.",
            )

        except JoseError as e:
            raise Exception(
                f"Token validation error: {str(e)}",
            )

        except Exception as e:
            raise Exception(
                f"Unexpected error during swagger token validation: {str(e)}"
            )

    return validate_swagger_token
