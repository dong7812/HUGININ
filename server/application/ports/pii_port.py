from abc import ABC, abstractmethod


class PiiPort(ABC):
    @abstractmethod
    def mask(self, text: str) -> str: ...
